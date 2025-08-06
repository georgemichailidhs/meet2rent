import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { createPaymentIntent, createOrRetrieveCustomer, eurosToCents, type PaymentType } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      propertyId,
      landlordId,
      amount, // in euros
      paymentType,
      propertyTitle,
      leaseId,
      applicationId
    }: {
      propertyId: number;
      landlordId: string;
      amount: number;
      paymentType: PaymentType;
      propertyTitle: string;
      leaseId?: string;
      applicationId?: string;
    } = body;

    // Validate required fields
    if (!propertyId || !landlordId || !amount || !paymentType || !propertyTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate payment type
    const validPaymentTypes: PaymentType[] = ['security_deposit', 'monthly_rent', 'platform_fee', 'late_fee'];
    if (!validPaymentTypes.includes(paymentType)) {
      return NextResponse.json(
        { error: 'Invalid payment type' },
        { status: 400 }
      );
    }

    // Create or retrieve Stripe customer for the tenant
    const customer = await createOrRetrieveCustomer(
      session.user.id,
      session.user.email!,
      session.user.name || undefined
    );

    // Convert amount to cents
    const amountInCents = eurosToCents(amount);

    // Create payment description
    const descriptions = {
      security_deposit: `Security deposit for ${propertyTitle}`,
      monthly_rent: `Monthly rent for ${propertyTitle}`,
      platform_fee: `Platform fee for ${propertyTitle}`,
      late_fee: `Late fee for ${propertyTitle}`
    };

    // Create payment intent
    const paymentIntent = await createPaymentIntent({
      propertyId,
      landlordId,
      tenantId: session.user.id,
      amount: amountInCents,
      currency: 'eur',
      paymentType,
      description: descriptions[paymentType],
      metadata: {
        propertyTitle,
        leaseId,
        applicationId
      }
    });

    // TODO: Save payment record to database
    console.log('Payment intent created:', {
      paymentIntentId: paymentIntent.id,
      amount: amountInCents,
      paymentType,
      propertyId,
      tenantId: session.user.id,
      landlordId
    });

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amountInCents,
        currency: 'eur',
        customerId: customer.id
      }
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
