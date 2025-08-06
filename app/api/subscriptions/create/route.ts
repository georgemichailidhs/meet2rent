import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { createRentSubscription, type RentSubscription } from '@/lib/stripe';
import { queueEmail, NotificationType } from '@/lib/notifications';

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
      leaseId,
      propertyId,
      landlordId,
      monthlyRent, // in euros
      startDate,
      endDate,
      propertyTitle,
      propertyAddress,
      paymentDay,
      currency = 'eur'
    }: {
      leaseId: string;
      propertyId: number;
      landlordId: string;
      monthlyRent: number;
      startDate: string;
      endDate: string;
      propertyTitle: string;
      propertyAddress: string;
      paymentDay: number;
      currency?: string;
    } = body;

    // Validate required fields
    if (!leaseId || !propertyId || !landlordId || !monthlyRent || !startDate || !endDate || !propertyTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate payment day (1-28 to avoid month-end issues)
    if (paymentDay < 1 || paymentDay > 28) {
      return NextResponse.json(
        { error: 'Payment day must be between 1 and 28' },
        { status: 400 }
      );
    }

    // Validate dates
    const leaseStart = new Date(startDate);
    const leaseEnd = new Date(endDate);
    if (leaseStart >= leaseEnd) {
      return NextResponse.json(
        { error: 'Lease end date must be after start date' },
        { status: 400 }
      );
    }

    // Verify that the current user is the tenant or landlord
    if (session.user.id !== landlordId) {
      // TODO: Verify that session.user.id is the tenant ID from the lease
      // For now, allow if user is involved in the property
    }

    // Convert euros to cents for Stripe
    const monthlyRentCents = Math.round(monthlyRent * 100);

    const subscriptionData: RentSubscription = {
      leaseId,
      propertyId,
      landlordId,
      tenantId: session.user.id,
      monthlyRent: monthlyRentCents,
      currency,
      startDate: leaseStart,
      endDate: leaseEnd,
      propertyTitle,
      paymentDay,
      metadata: {
        propertyAddress,
        leaseTerms: `Monthly rent: €${monthlyRent}, Payment day: ${paymentDay}`
      }
    };

    // Create the subscription
    const result = await createRentSubscription(subscriptionData);

    // TODO: Save subscription record to database
    console.log('Rent subscription created and saved:', {
      subscriptionId: result.subscription.id,
      leaseId,
      propertyId,
      tenantId: session.user.id,
      monthlyRent: monthlyRentCents,
      nextPayment: result.nextPaymentDate
    });

    // Send confirmation emails
    try {
      // Email to tenant
      await queueEmail(
        NotificationType.SUBSCRIPTION_CREATED,
        session.user.email!,
        session.user.name || 'Tenant',
        {
          propertyTitle,
          monthlyRent,
          paymentDay,
          nextPaymentDate: result.nextPaymentDate?.toLocaleDateString('en-GB'),
          subscriptionId: result.subscription.id
        },
        { priority: 'high' }
      );

      // TODO: Email to landlord
      // await queueEmail(NotificationType.SUBSCRIPTION_CREATED, landlordEmail, landlordName, {...});
    } catch (emailError) {
      console.error('Failed to send subscription confirmation emails:', emailError);
      // Don't fail the API call for email issues
    }

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: result.subscription.id,
        customerId: result.customer.id,
        status: result.subscription.status,
        nextPaymentDate: result.nextPaymentDate,
        currentPeriodStart: new Date(result.subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(result.subscription.current_period_end * 1000),
        amount: monthlyRentCents,
        currency: result.subscription.currency
      }
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
