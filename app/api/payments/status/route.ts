import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      );
    }

    // Verify that the payment belongs to the current user
    if (paymentIntent.metadata.tenantId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to payment' },
        { status: 403 }
      );
    }

    // Extract metadata
    const {
      propertyId,
      landlordId,
      paymentType,
      propertyTitle,
      contractId,
      applicationId,
      leaseId
    } = paymentIntent.metadata;

    // Prepare response data
    const paymentData = {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      paymentType,
      propertyId: parseInt(propertyId),
      propertyTitle,
      landlordId,
      contractId,
      applicationId,
      leaseId,
      createdAt: new Date(paymentIntent.created * 1000),
      description: paymentIntent.description
    };

    // TODO: Update database records based on payment status
    if (paymentIntent.status === 'succeeded') {
      // Handle successful payment
      switch (paymentType) {
        case 'security_deposit':
          // TODO: Mark application as payment received
          // TODO: Trigger contract generation
          console.log('Security deposit paid, triggering contract generation');
          break;

        case 'monthly_rent':
          // TODO: Update lease payment record
          // TODO: Extend lease payment due date
          console.log('Monthly rent paid, updating lease records');
          break;

        case 'platform_fee':
          // TODO: Update platform fee status
          console.log('Platform fee paid');
          break;

        case 'late_fee':
          // TODO: Clear late fee status
          console.log('Late fee paid');
          break;
      }

      // TODO: Send confirmation email
      // TODO: Create payment record in database
    }

    return NextResponse.json({
      success: true,
      data: paymentData
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}

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
    const { paymentIntentId, action } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Verify ownership
    if (paymentIntent.metadata.tenantId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to payment' },
        { status: 403 }
      );
    }

    switch (action) {
      case 'cancel':
        // Cancel payment intent if possible
        if (paymentIntent.status === 'requires_payment_method' ||
            paymentIntent.status === 'requires_confirmation') {
          await stripe.paymentIntents.cancel(paymentIntentId);

          return NextResponse.json({
            success: true,
            message: 'Payment cancelled successfully'
          });
        } else {
          return NextResponse.json(
            { error: 'Payment cannot be cancelled in current status' },
            { status: 400 }
          );
        }

      case 'retry':
        // Create new payment intent for retry
        const newPaymentIntent = await stripe.paymentIntents.create({
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata,
          description: paymentIntent.description
        });

        return NextResponse.json({
          success: true,
          data: {
            clientSecret: newPaymentIntent.client_secret,
            paymentIntentId: newPaymentIntent.id
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Payment action error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment action' },
      { status: 500 }
    );
  }
}
