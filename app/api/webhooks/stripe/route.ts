import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/database/config';
import { payments, users, properties, subscriptions } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import { queueEmail, NotificationType } from '@/lib/notifications';
import { handleFailedRentPayment, calculateLateFee } from '@/lib/stripe-subscriptions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature')!

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Find payment in database
    const payment = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, paymentIntent.id))
      .limit(1);

    if (!payment[0]) {
      console.error('Payment not found for PaymentIntent:', paymentIntent.id);
      return;
    }

    // Update payment status
    const updatedPayment = await db
      .update(payments)
      .set({
        status: 'completed',
        paidAt: new Date(),
        stripeChargeId: paymentIntent.latest_charge as string,
      })
      .where(eq(payments.id, payment[0].id))
      .returning();

    // Get related data for notifications
    const [payer, property, landlord] = await Promise.all([
      db.select().from(users).where(eq(users.id, payment[0].tenantId)).limit(1),
      payment[0].propertyId
        ? db.select().from(properties).where(eq(properties.id, payment[0].propertyId)).limit(1)
        : Promise.resolve([null]),
      payment[0].landlordId
        ? db.select().from(users).where(eq(users.id, payment[0].landlordId)).limit(1)
        : Promise.resolve([null]),
    ]);

    // Send payment confirmation emails
    try {
      // Email to payer (tenant)
      if (payer[0]) {
        await queueEmail(
          NotificationType.PAYMENT_RECEIVED,
          payer[0].email!,
          payer[0].name!,
          {
            amount: Number(payment[0].amount),
            paymentType: payment[0].type,
            propertyTitle: property[0]?.title || 'Property',
            paymentId: paymentIntent.id,
          },
          { priority: 'high', language: 'en' }
        );
      }

      // Email to landlord if applicable
      if (landlord[0] && payment[0].type !== 'platform_fee') {
        await queueEmail(
          NotificationType.PAYMENT_RECEIVED,
          landlord[0].email!,
          landlord[0].name!,
          {
            amount: Number(payment[0].amount),
            paymentType: payment[0].type,
            propertyTitle: property[0]?.title || 'Property',
            paymentId: paymentIntent.id,
            tenantName: payer[0]?.name || 'Tenant',
          },
          { priority: 'high', language: 'en' }
        );
      }
    } catch (emailError) {
      console.error('Failed to send payment confirmation emails:', emailError);
    }

    console.log('Payment succeeded:', updatedPayment[0]);

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Find payment in database
    const payment = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, paymentIntent.id))
      .limit(1);

    if (!payment[0]) {
      console.error('Payment not found for PaymentIntent:', paymentIntent.id);
      return;
    }

    // Update payment status
    await db
      .update(payments)
      .set({
        status: 'failed',
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
      })
      .where(eq(payments.id, payment[0].id));

    // Get payer info
    const payer = await db
      .select()
      .from(users)
      .where(eq(users.id, payment[0].userId))
      .limit(1);

    // Send payment failure notification
    if (payer[0]) {
      try {
        await queueEmail(
          NotificationType.PAYMENT_FAILED,
          payer[0].email!,
          payer[0].name!,
          {
            amount: Number(payment[0].amount),
            paymentType: payment[0].type,
            failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
            paymentId: paymentIntent.id,
          },
          { priority: 'high', language: 'en' }
        );
      } catch (emailError) {
        console.error('Failed to send payment failure email:', emailError);
      }
    }

    console.log('Payment failed:', payment[0].id);

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Find payment in database
    const payment = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, paymentIntent.id))
      .limit(1);

    if (!payment[0]) {
      console.error('Payment not found for PaymentIntent:', paymentIntent.id);
      return;
    }

    // Update payment status
    await db
      .update(payments)
      .set({
        status: 'canceled',
      })
      .where(eq(payments.id, payment[0].id));

    console.log('Payment canceled:', payment[0].id);

  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    if (!invoice.subscription) return;

    // Get subscription from database
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, invoice.subscription as string))
      .limit(1);

    if (!subscription[0]) {
      console.error('Subscription not found for invoice:', invoice.id);
      return;
    }

    // Get related data
    const [property, tenant, landlord] = await Promise.all([
      db.select().from(properties).where(eq(properties.id, subscription[0].propertyId)).limit(1),
      db.select().from(users).where(eq(users.id, subscription[0].tenantId)).limit(1),
      db.select().from(users).where(eq(users.id, subscription[0].landlordId)).limit(1),
    ]);

    // Send payment confirmation emails
    if (tenant[0] && property[0]) {
      try {
        await Promise.all([
          // Email to tenant
          queueEmail(
            NotificationType.PAYMENT_RECEIVED,
            tenant[0].email!,
            tenant[0].name!,
            {
              amount: invoice.amount_paid / 100,
              paymentType: 'monthly_rent',
              propertyTitle: property[0].title,
              paymentId: invoice.id,
              paidDate: new Date().toLocaleDateString('en-GB'),
            },
            { priority: 'high', language: 'en' }
          ),
          // Email to landlord
          landlord[0] && queueEmail(
            NotificationType.PAYMENT_RECEIVED,
            landlord[0].email!,
            landlord[0].name!,
            {
              amount: invoice.amount_paid / 100,
              paymentType: 'monthly_rent',
              propertyTitle: property[0].title,
              paymentId: invoice.id,
              tenantName: tenant[0].name,
              paidDate: new Date().toLocaleDateString('en-GB'),
            },
            { priority: 'high', language: 'en' }
          ),
        ]);
      } catch (emailError) {
        console.error('Failed to send rent payment confirmation:', emailError);
      }
    }

    console.log('Rent payment succeeded:', invoice.id);
  } catch (error) {
    console.error('Error handling invoice payment success:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    if (!invoice.subscription) return;

    // Get subscription from database
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, invoice.subscription as string))
      .limit(1);

    if (!subscription[0]) {
      console.error('Subscription not found for invoice:', invoice.id);
      return;
    }

    // Calculate late fee
    const dueDate = new Date(invoice.due_date! * 1000);
    const now = new Date();
    const daysLate = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const lateFee = calculateLateFee(invoice.amount_due, daysLate);

    // Handle failed payment with retry logic
    await handleFailedRentPayment(
      invoice.subscription as string,
      invoice.id,
      {
        maxRetries: 3,
        applyLateFee: lateFee > 0,
        lateFeeAmount: lateFee,
        notifyTenant: true,
      }
    );

    console.log('Handled failed rent payment:', invoice.id);
  } catch (error) {
    console.error('Error handling invoice payment failure:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    // Update subscription status in database
    await db
      .update(subscriptions)
      .set({
        status: subscription.status as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        nextPaymentDate: new Date(subscription.current_period_end * 1000),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

    console.log('Subscription created:', subscription.id);
  } catch (error) {
    console.error('Error handling subscription creation:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    // Update subscription status in database
    await db
      .update(subscriptions)
      .set({
        status: subscription.status as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        nextPaymentDate: new Date(subscription.current_period_end * 1000),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

    console.log('Subscription updated:', subscription.id);
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    // Update subscription status in database
    await db
      .update(subscriptions)
      .set({
        status: 'canceled',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

    // Get related data for notification
    const dbSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
      .limit(1);

    if (dbSubscription[0]) {
      const [property, tenant] = await Promise.all([
        db.select().from(properties).where(eq(properties.id, dbSubscription[0].propertyId)).limit(1),
        db.select().from(users).where(eq(users.id, dbSubscription[0].tenantId)).limit(1),
      ]);

      // Send cancellation notification
      if (tenant[0] && property[0]) {
        try {
          await queueEmail(
            NotificationType.SUBSCRIPTION_CANCELLED,
            tenant[0].email!,
            tenant[0].name!,
            {
              propertyTitle: property[0].title,
              subscriptionId: subscription.id,
              canceledAt: new Date(subscription.canceled_at! * 1000).toLocaleDateString('en-GB'),
            },
            { priority: 'high', language: 'en' }
          );
        } catch (emailError) {
          console.error('Failed to send subscription cancellation email:', emailError);
        }
      }
    }

    console.log('Subscription deleted:', subscription.id);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}
