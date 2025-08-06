import Stripe from 'stripe';
import { db } from './database/config';
import { subscriptions, contracts, users, properties } from './database/schema';
import { eq } from 'drizzle-orm';
import { queueEmail, NotificationType } from './notifications';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export interface CreateSubscriptionParams {
  contractId: string;
  tenantId: string;
  landlordId: string;
  propertyId: string;
  monthlyRent: number;
  startDate: Date;
  paymentMethodId?: string;
}

export interface SubscriptionData {
  id: string;
  contractId: string;
  tenantId: string;
  landlordId: string;
  propertyId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'paused';
  monthlyRent: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextPaymentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a Stripe customer for a tenant
 */
export async function createStripeCustomer(tenantId: string): Promise<string> {
  try {
    // Get tenant info
    const tenant = await db
      .select()
      .from(users)
      .where(eq(users.id, tenantId))
      .limit(1);

    if (!tenant[0]) {
      throw new Error('Tenant not found');
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: tenant[0].email!,
      name: tenant[0].name!,
      phone: tenant[0].phone || undefined,
      metadata: {
        userId: tenantId,
        userType: 'tenant',
      },
    });

    // Update user with Stripe customer ID
    await db
      .update(users)
      .set({
        stripeCustomerId: customer.id,
        updatedAt: new Date(),
      })
      .where(eq(users.id, tenantId));

    return customer.id;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

/**
 * Create a recurring subscription for monthly rent
 */
export async function createRentSubscription(params: CreateSubscriptionParams): Promise<SubscriptionData> {
  try {
    const { contractId, tenantId, landlordId, propertyId, monthlyRent, startDate, paymentMethodId } = params;

    // Get or create Stripe customer
    const tenant = await db
      .select()
      .from(users)
      .where(eq(users.id, tenantId))
      .limit(1);

    if (!tenant[0]) {
      throw new Error('Tenant not found');
    }

    let customerId = tenant[0].stripeCustomerId;
    if (!customerId) {
      customerId = await createStripeCustomer(tenantId);
    }

    // Get property and landlord info
    const [property, landlord] = await Promise.all([
      db.select().from(properties).where(eq(properties.id, propertyId)).limit(1),
      db.select().from(users).where(eq(users.id, landlordId)).limit(1),
    ]);

    if (!property[0] || !landlord[0]) {
      throw new Error('Property or landlord not found');
    }

    // Create or get existing product for this property
    const productId = await getOrCreateRentProduct(property[0]);

    // Create price for monthly rent
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: Math.round(monthlyRent * 100), // Convert to cents
      currency: 'eur',
      recurring: {
        interval: 'month',
        interval_count: 1,
      },
      metadata: {
        propertyId,
        contractId,
        landlordId,
      },
    });

    // Calculate trial period until start date
    const now = new Date();
    const trialDays = Math.max(0, Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Create subscription
    const subscriptionData: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: price.id }],
      metadata: {
        contractId,
        tenantId,
        landlordId,
        propertyId,
        propertyTitle: property[0].title,
      },
      expand: ['latest_invoice.payment_intent'],
    };

    // Add trial period if start date is in the future
    if (trialDays > 0) {
      subscriptionData.trial_period_days = trialDays;
    }

    // Add payment method if provided
    if (paymentMethodId) {
      subscriptionData.default_payment_method = paymentMethodId;
    }

    const subscription = await stripe.subscriptions.create(subscriptionData);

    // Save subscription to database
    const newSubscription = await db.insert(subscriptions).values({
      contractId,
      tenantId,
      landlordId,
      propertyId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      status: subscription.status as any,
      monthlyRent: monthlyRent.toString(),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      nextPaymentDate: new Date(subscription.current_period_end * 1000),
    }).returning();

    // Send confirmation emails
    try {
      await Promise.all([
        // Email to tenant
        queueEmail(
          NotificationType.SUBSCRIPTION_CREATED,
          tenant[0].email!,
          tenant[0].name!,
          {
            propertyTitle: property[0].title,
            subscriptionId: subscription.id,
            amount: monthlyRent,
            nextPaymentDate: new Date(subscription.current_period_end * 1000).toLocaleDateString('en-GB'),
            startDate: startDate.toLocaleDateString('en-GB'),
          },
          { priority: 'high', language: 'en' }
        ),
        // Email to landlord
        queueEmail(
          NotificationType.SUBSCRIPTION_CREATED,
          landlord[0].email!,
          landlord[0].name!,
          {
            propertyTitle: property[0].title,
            subscriptionId: subscription.id,
            amount: monthlyRent,
            tenantName: tenant[0].name,
            nextPaymentDate: new Date(subscription.current_period_end * 1000).toLocaleDateString('en-GB'),
          },
          { priority: 'high', language: 'en' }
        ),
      ]);
    } catch (emailError) {
      console.error('Failed to send subscription creation emails:', emailError);
    }

    return newSubscription[0] as SubscriptionData;
  } catch (error) {
    console.error('Error creating rent subscription:', error);
    throw error;
  }
}

/**
 * Get or create a Stripe product for rent payments
 */
async function getOrCreateRentProduct(property: any): Promise<string> {
  const productName = `Monthly Rent - ${property.title}`;

  // Check if product already exists
  const existingProducts = await stripe.products.list({
    limit: 100,
  });

  const existingProduct = existingProducts.data.find(
    product => product.metadata.propertyId === property.id
  );

  if (existingProduct) {
    return existingProduct.id;
  }

  // Create new product
  const product = await stripe.products.create({
    name: productName,
    description: `Monthly rent payment for ${property.title} at ${property.address}`,
    metadata: {
      propertyId: property.id,
      type: 'monthly_rent',
    },
  });

  return product.id;
}

/**
 * Update subscription payment method
 */
export async function updateSubscriptionPaymentMethod(
  subscriptionId: string,
  paymentMethodId: string
): Promise<void> {
  try {
    await stripe.subscriptions.update(subscriptionId, {
      default_payment_method: paymentMethodId,
    });

    console.log(`Updated payment method for subscription ${subscriptionId}`);
  } catch (error) {
    console.error('Error updating subscription payment method:', error);
    throw error;
  }
}

/**
 * Pause a subscription (e.g., for maintenance periods)
 */
export async function pauseSubscription(
  subscriptionId: string,
  resumeDate?: Date
): Promise<void> {
  try {
    const updateData: Stripe.SubscriptionUpdateParams = {
      pause_collection: {
        behavior: 'mark_uncollectible',
      },
    };

    if (resumeDate) {
      updateData.pause_collection = {
        behavior: 'mark_uncollectible',
        resumes_at: Math.floor(resumeDate.getTime() / 1000),
      };
    }

    await stripe.subscriptions.update(subscriptionId, updateData);

    // Update database
    await db
      .update(subscriptions)
      .set({
        status: 'paused',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

    console.log(`Paused subscription ${subscriptionId}`);
  } catch (error) {
    console.error('Error pausing subscription:', error);
    throw error;
  }
}

/**
 * Resume a paused subscription
 */
export async function resumeSubscription(subscriptionId: string): Promise<void> {
  try {
    await stripe.subscriptions.update(subscriptionId, {
      pause_collection: undefined,
    });

    // Update database
    await db
      .update(subscriptions)
      .set({
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

    console.log(`Resumed subscription ${subscriptionId}`);
  } catch (error) {
    console.error('Error resuming subscription:', error);
    throw error;
  }
}

/**
 * Cancel a subscription (e.g., when lease ends)
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd = true
): Promise<void> {
  try {
    if (cancelAtPeriodEnd) {
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      await stripe.subscriptions.cancel(subscriptionId);
    }

    // Update database
    await db
      .update(subscriptions)
      .set({
        status: cancelAtPeriodEnd ? 'active' : 'canceled',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

    console.log(`${cancelAtPeriodEnd ? 'Scheduled cancellation for' : 'Canceled'} subscription ${subscriptionId}`);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Handle failed rent payment with retry logic
 */
export async function handleFailedRentPayment(
  subscriptionId: string,
  invoiceId: string,
  options: {
    maxRetries?: number;
    applyLateFee?: boolean;
    lateFeeAmount?: number;
    notifyTenant?: boolean;
  } = {}
): Promise<void> {
  try {
    const {
      maxRetries = 3,
      applyLateFee = false,
      lateFeeAmount = 0,
      notifyTenant = true,
    } = options;

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const invoice = await stripe.invoices.retrieve(invoiceId);

    // Apply late fee if specified
    if (applyLateFee && lateFeeAmount > 0) {
      await stripe.invoiceItems.create({
        customer: subscription.customer as string,
        amount: lateFeeAmount,
        currency: 'eur',
        description: 'Late payment fee',
        metadata: {
          subscriptionId,
          invoiceId,
          type: 'late_fee',
        },
      });
    }

    // Retry payment
    try {
      await stripe.invoices.pay(invoiceId, {
        payment_method: subscription.default_payment_method as string,
      });
    } catch (retryError) {
      console.error('Payment retry failed:', retryError);
    }

    // Notify tenant if requested
    if (notifyTenant) {
      const dbSubscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
        .limit(1);

      if (dbSubscription[0]) {
        const tenant = await db
          .select()
          .from(users)
          .where(eq(users.id, dbSubscription[0].tenantId))
          .limit(1);

        const property = await db
          .select()
          .from(properties)
          .where(eq(properties.id, dbSubscription[0].propertyId))
          .limit(1);

        if (tenant[0] && property[0]) {
          await queueEmail(
            NotificationType.PAYMENT_FAILED,
            tenant[0].email!,
            tenant[0].name!,
            {
              amount: Number(dbSubscription[0].monthlyRent),
              propertyTitle: property[0].title,
              dueDate: new Date(invoice.due_date! * 1000).toLocaleDateString('en-GB'),
              attemptCount: invoice.attempt_count,
              lateFee: applyLateFee ? lateFeeAmount / 100 : null,
              subscriptionId,
            },
            { priority: 'high', language: 'en' }
          );
        }
      }
    }

    console.log(`Handled failed payment for subscription ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling failed rent payment:', error);
    throw error;
  }
}

/**
 * Calculate late fee based on rent amount and days late
 */
export function calculateLateFee(rentAmount: number, daysLate: number): number {
  // Grace period of 5 days
  if (daysLate <= 5) {
    return 0;
  }

  // 5% of rent amount for first week late
  if (daysLate <= 12) {
    return Math.round(rentAmount * 0.05);
  }

  // 10% of rent amount for more than a week late
  return Math.round(rentAmount * 0.10);
}

/**
 * Get subscription details with related data
 */
export async function getSubscriptionDetails(subscriptionId: string): Promise<any> {
  try {
    const [stripeSubscription, dbSubscription] = await Promise.all([
      stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['customer', 'latest_invoice'],
      }),
      db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
        .limit(1),
    ]);

    if (!dbSubscription[0]) {
      throw new Error('Subscription not found in database');
    }

    // Get related data
    const [property, tenant, landlord] = await Promise.all([
      db.select().from(properties).where(eq(properties.id, dbSubscription[0].propertyId)).limit(1),
      db.select().from(users).where(eq(users.id, dbSubscription[0].tenantId)).limit(1),
      db.select().from(users).where(eq(users.id, dbSubscription[0].landlordId)).limit(1),
    ]);

    return {
      stripeSubscription,
      dbSubscription: dbSubscription[0],
      property: property[0],
      tenant: tenant[0],
      landlord: landlord[0],
    };
  } catch (error) {
    console.error('Error getting subscription details:', error);
    throw error;
  }
}
