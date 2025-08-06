import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/database/config';
import { payments, properties, users, contracts } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import { queueEmail, NotificationType } from '@/lib/notifications';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      amount,
      paymentType,
      propertyId,
      contractId,
      description,
      currency = 'eur',
    } = body;

    if (!amount || !paymentType || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount and payment type are required' },
        { status: 400 }
      );
    }

    // Get property and landlord info
    let property = null;
    let landlord = null;
    let contract = null;

    if (propertyId) {
      const propertyData = await db
        .select()
        .from(properties)
        .where(eq(properties.id, propertyId))
        .limit(1);

      if (propertyData[0]) {
        property = propertyData[0];

        const landlordData = await db
          .select()
          .from(users)
          .where(eq(users.id, property.landlordId))
          .limit(1);

        landlord = landlordData[0];
      }
    }

    if (contractId) {
      const contractData = await db
        .select()
        .from(contracts)
        .where(eq(contracts.id, contractId))
        .limit(1);

      contract = contractData[0];
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      metadata: {
        userId: session.user.id,
        paymentType,
        propertyId: propertyId || '',
        contractId: contractId || '',
        description: description || '',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create payment record in database
    const newPayment = await db.insert(payments).values({
      tenantId: session.user.id,
      propertyId: propertyId || null,
      leaseId: contractId || null,
      landlordId: landlord?.id || null,
      amount: amount.toString(),
      currency: currency,
      paymentType: paymentType,
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id,
      description: description || null,
    }).returning();

    return NextResponse.json({
      success: true,
      data: {
        payment: newPayment[0],
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

// Get payments for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType'); // 'tenant' | 'landlord'
    const status = searchParams.get('status');
    const paymentType = searchParams.get('paymentType');

    // Build query conditions
    const conditions = [];

    if (userType === 'landlord') {
      conditions.push(eq(payments.landlordId, session.user.id));
    } else {
      conditions.push(eq(payments.tenantId, session.user.id));
    }

    if (status) {
      conditions.push(eq(payments.status, status as any));
    }

    if (paymentType) {
      conditions.push(eq(payments.type, paymentType as any));
    }

    // Get payments with related data
    const userPayments = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        currency: payments.currency,
        paymentType: payments.type,
        status: payments.status,
        description: payments.description,
        stripePaymentIntentId: payments.stripePaymentIntentId,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
        property: {
          id: properties.id,
          title: properties.title,
          address: properties.address,
          city: properties.city,
        },
        payer: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(payments)
      .leftJoin(properties, eq(payments.propertyId, properties.id))
      .leftJoin(users, userType === 'landlord'
        ? eq(payments.tenantId, users.id)
        : eq(payments.landlordId, users.id)
      )
      .where(conditions.length > 0 ? conditions.reduce((acc, condition) => acc && condition) : undefined)
      .orderBy(payments.createdAt);

    return NextResponse.json({
      success: true,
      data: {
        payments: userPayments,
      },
    });

  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
