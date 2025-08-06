import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import {
  updateRentSubscription,
  cancelRentSubscription,
  getSubscriptionDetails
} from '@/lib/stripe';
import { queueEmail, NotificationType } from '@/lib/notifications';

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
    const subscriptionId = searchParams.get('subscription_id');

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // TODO: Verify user has access to this subscription

    const details = await getSubscriptionDetails(subscriptionId);

    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          id: details.subscription.id,
          status: details.subscription.status,
          currentPeriodStart: new Date(details.subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(details.subscription.current_period_end * 1000),
          cancelAt: details.subscription.cancel_at ? new Date(details.subscription.cancel_at * 1000) : null,
          amount: details.subscription.items.data[0].price.unit_amount,
          currency: details.subscription.currency,
          metadata: details.subscription.metadata
        },
        nextPaymentDate: details.nextPaymentDate,
        totalPaid: details.totalPaid,
        invoiceCount: details.invoices.length,
        recentInvoices: details.invoices.slice(0, 5).map(invoice => ({
          id: invoice.id,
          amount: invoice.amount_paid,
          status: invoice.status,
          createdAt: new Date(invoice.created * 1000),
          paidAt: invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : null
        }))
      }
    });

  } catch (error) {
    console.error('Error retrieving subscription details:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve subscription details' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
      subscriptionId,
      action,
      updates
    }: {
      subscriptionId: string;
      action: 'update' | 'pause' | 'resume' | 'cancel';
      updates?: {
        monthlyRent?: number; // in euros
        paymentDay?: number;
        endDate?: string;
      };
    } = body;

    if (!subscriptionId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: subscriptionId, action' },
        { status: 400 }
      );
    }

    // TODO: Verify user has permission to modify this subscription

    let result;

    switch (action) {
      case 'update':
        if (!updates) {
          return NextResponse.json(
            { error: 'Updates are required for update action' },
            { status: 400 }
          );
        }

        const updateData: any = {};

        if (updates.monthlyRent) {
          // Convert euros to cents
          updateData.monthlyRent = Math.round(updates.monthlyRent * 100);
        }

        if (updates.paymentDay) {
          if (updates.paymentDay < 1 || updates.paymentDay > 28) {
            return NextResponse.json(
              { error: 'Payment day must be between 1 and 28' },
              { status: 400 }
            );
          }
          updateData.paymentDay = updates.paymentDay;
        }

        if (updates.endDate) {
          updateData.endDate = new Date(updates.endDate);
        }

        result = await updateRentSubscription(subscriptionId, updateData);

        // Send notification about subscription update
        await queueEmail(
          NotificationType.SUBSCRIPTION_CREATED, // Reuse for updates
          session.user.email!,
          session.user.name || 'Tenant',
          {
            propertyTitle: result.metadata.propertyTitle || 'Your rental property',
            monthlyRent: updates.monthlyRent || (result.items.data[0].price.unit_amount / 100),
            subscriptionId: result.id,
            action: 'updated'
          }
        );

        break;

      case 'pause':
        result = await updateRentSubscription(subscriptionId, { status: 'paused' });

        console.log('Rent subscription paused:', {
          subscriptionId,
          userId: session.user.id,
          pausedAt: new Date()
        });
        break;

      case 'resume':
        result = await updateRentSubscription(subscriptionId, { status: 'active' });

        console.log('Rent subscription resumed:', {
          subscriptionId,
          userId: session.user.id,
          resumedAt: new Date()
        });
        break;

      case 'cancel':
        const cancellationReason = updates?.endDate
          ? 'Lease terminated early'
          : 'Lease ended normally';

        result = await cancelRentSubscription(subscriptionId, cancellationReason);

        // Send cancellation notification
        await queueEmail(
          NotificationType.SUBSCRIPTION_CANCELLED,
          session.user.email!,
          session.user.name || 'Tenant',
          {
            propertyTitle: result.metadata.propertyTitle || 'Your rental property',
            subscriptionId: result.id,
            canceledAt: new Date().toLocaleDateString('en-GB'),
            reason: cancellationReason
          }
        );

        console.log('Rent subscription canceled:', {
          subscriptionId,
          userId: session.user.id,
          reason: cancellationReason,
          canceledAt: new Date()
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: update, pause, resume, or cancel' },
          { status: 400 }
        );
    }

    // TODO: Update subscription record in database

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: result.id,
        status: result.status,
        action: action,
        updatedAt: new Date(),
        cancelAt: result.cancel_at ? new Date(result.cancel_at * 1000) : null
      }
    });

  } catch (error) {
    console.error('Subscription management error:', error);
    return NextResponse.json(
      { error: 'Failed to manage subscription' },
      { status: 500 }
    );
  }
}
