import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Client-side Stripe instance
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Payment types for Meet2Rent
export type PaymentType = 'security_deposit' | 'monthly_rent' | 'platform_fee' | 'late_fee';

export interface PaymentIntent {
  propertyId: number;
  landlordId: string;
  tenantId: string;
  amount: number; // in cents
  currency: string;
  paymentType: PaymentType;
  description: string;
  metadata: {
    propertyTitle: string;
    leaseId?: string;
    applicationId?: string;
  };
}

// Enhanced subscription interface for rent automation
export interface RentSubscription {
  leaseId: string;
  propertyId: number;
  landlordId: string;
  tenantId: string;
  monthlyRent: number; // in cents
  currency: string;
  startDate: Date;
  endDate: Date;
  propertyTitle: string;
  paymentDay: number; // day of month (1-28)
  metadata: {
    propertyAddress: string;
    leaseTerms: string;
  };
}

// Create payment intent for various rental payments
export const createPaymentIntent = async (paymentData: PaymentIntent) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: paymentData.amount,
      currency: paymentData.currency,
      description: paymentData.description,
      metadata: {
        propertyId: paymentData.propertyId.toString(),
        landlordId: paymentData.landlordId,
        tenantId: paymentData.tenantId,
        paymentType: paymentData.paymentType,
        propertyTitle: paymentData.metadata.propertyTitle,
        ...(paymentData.metadata.leaseId && { leaseId: paymentData.metadata.leaseId }),
        ...(paymentData.metadata.applicationId && { applicationId: paymentData.metadata.applicationId }),
      },
      // Connect account for landlord payouts (when implemented)
      // transfer_data: {
      //   destination: landlordStripeAccountId,
      // },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

// Create recurring rent subscription
export const createRentSubscription = async (subscriptionData: RentSubscription) => {
  try {
    // First create or retrieve customer
    const customer = await createOrRetrieveCustomer(
      subscriptionData.tenantId,
      '', // Email will be retrieved from database
      '' // Name will be retrieved from database
    );

    // Create product for this property if it doesn't exist
    const productId = `property-${subscriptionData.propertyId}`;
    let product;

    try {
      product = await stripe.products.retrieve(productId);
    } catch (error) {
      // Product doesn't exist, create it
      product = await stripe.products.create({
        id: productId,
        name: `Monthly Rent - ${subscriptionData.propertyTitle}`,
        description: `Automated monthly rent payment for ${subscriptionData.propertyTitle}`,
        metadata: {
          propertyId: subscriptionData.propertyId.toString(),
          landlordId: subscriptionData.landlordId,
          propertyAddress: subscriptionData.metadata.propertyAddress
        }
      });
    }

    // Create price for monthly rent
    const price = await stripe.prices.create({
      unit_amount: subscriptionData.monthlyRent,
      currency: subscriptionData.currency,
      recurring: {
        interval: 'month',
        interval_count: 1,
        usage_type: 'licensed'
      },
      product: product.id,
      metadata: {
        leaseId: subscriptionData.leaseId,
        propertyId: subscriptionData.propertyId.toString(),
        paymentDay: subscriptionData.paymentDay.toString()
      }
    });

    // Calculate billing cycle anchor (next payment date)
    const now = new Date();
    const billingCycleAnchor = new Date(
      now.getFullYear(),
      now.getMonth(),
      subscriptionData.paymentDay
    );

    // If payment day has passed this month, start next month
    if (billingCycleAnchor <= now) {
      billingCycleAnchor.setMonth(billingCycleAnchor.getMonth() + 1);
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price: price.id,
      }],
      billing_cycle_anchor: Math.floor(billingCycleAnchor.getTime() / 1000),
      proration_behavior: 'none',
      metadata: {
        leaseId: subscriptionData.leaseId,
        propertyId: subscriptionData.propertyId.toString(),
        landlordId: subscriptionData.landlordId,
        tenantId: subscriptionData.tenantId,
        propertyTitle: subscriptionData.propertyTitle,
        startDate: subscriptionData.startDate.toISOString(),
        endDate: subscriptionData.endDate.toISOString(),
        paymentDay: subscriptionData.paymentDay.toString()
      },
      // Cancel subscription at lease end
      cancel_at: Math.floor(subscriptionData.endDate.getTime() / 1000),
      expand: ['latest_invoice.payment_intent']
    });

    console.log('Rent subscription created:', {
      subscriptionId: subscription.id,
      customerId: customer.id,
      priceId: price.id,
      amount: subscriptionData.monthlyRent,
      nextPayment: billingCycleAnchor.toISOString()
    });

    return {
      subscription,
      customer,
      price,
      product,
      nextPaymentDate: billingCycleAnchor
    };

  } catch (error) {
    console.error('Error creating rent subscription:', error);
    throw error;
  }
};

// Update rent subscription (for rent changes, payment date changes, etc.)
export const updateRentSubscription = async (
  subscriptionId: string,
  updates: {
    monthlyRent?: number;
    paymentDay?: number;
    endDate?: Date;
    status?: 'active' | 'paused' | 'canceled';
  }
) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const updateData: any = {};

    // Update payment amount if specified
    if (updates.monthlyRent) {
      // Create new price for updated rent amount
      const newPrice = await stripe.prices.create({
        unit_amount: updates.monthlyRent,
        currency: subscription.currency || 'eur',
        recurring: {
          interval: 'month',
          interval_count: 1,
        },
        product: subscription.items.data[0].price.product as string,
        metadata: {
          leaseId: subscription.metadata.leaseId,
          propertyId: subscription.metadata.propertyId,
          paymentDay: updates.paymentDay?.toString() || subscription.metadata.paymentDay
        }
      });

      updateData.items = [{
        id: subscription.items.data[0].id,
        price: newPrice.id
      }];
    }

    // Update billing cycle if payment day changed
    if (updates.paymentDay) {
      const now = new Date();
      const newBillingDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        updates.paymentDay
      );

      if (newBillingDate <= now) {
        newBillingDate.setMonth(newBillingDate.getMonth() + 1);
      }

      updateData.billing_cycle_anchor = Math.floor(newBillingDate.getTime() / 1000);
      updateData.proration_behavior = 'none';
    }

    // Update cancellation date if lease end date changed
    if (updates.endDate) {
      updateData.cancel_at = Math.floor(updates.endDate.getTime() / 1000);
    }

    // Handle status changes
    if (updates.status) {
      switch (updates.status) {
        case 'paused':
          updateData.pause_collection = { behavior: 'mark_uncollectible' };
          break;
        case 'canceled':
          return await stripe.subscriptions.cancel(subscriptionId);
        case 'active':
          updateData.pause_collection = null;
          break;
      }
    }

    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      updateData
    );

    console.log('Rent subscription updated:', {
      subscriptionId,
      updates,
      status: updatedSubscription.status
    });

    return updatedSubscription;

  } catch (error) {
    console.error('Error updating rent subscription:', error);
    throw error;
  }
};

// Cancel rent subscription (for lease termination)
export const cancelRentSubscription = async (
  subscriptionId: string,
  cancellationReason?: string
) => {
  try {
    const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId, {
      cancellation_details: {
        comment: cancellationReason || 'Lease terminated'
      }
    });

    console.log('Rent subscription canceled:', {
      subscriptionId,
      reason: cancellationReason,
      canceledAt: new Date(canceledSubscription.canceled_at! * 1000)
    });

    return canceledSubscription;

  } catch (error) {
    console.error('Error canceling rent subscription:', error);
    throw error;
  }
};

// Get subscription details with payment history
export const getSubscriptionDetails = async (subscriptionId: string) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['customer', 'latest_invoice.payment_intent']
    });

    // Get invoice history
    const invoices = await stripe.invoices.list({
      subscription: subscriptionId,
      limit: 12, // Last 12 months
      expand: ['data.payment_intent']
    });

    // Get upcoming invoice
    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      subscription: subscriptionId
    }).catch(() => null); // May not exist if subscription is ending

    return {
      subscription,
      invoices: invoices.data,
      upcomingInvoice,
      nextPaymentDate: upcomingInvoice
        ? new Date(upcomingInvoice.next_payment_attempt! * 1000)
        : null,
      totalPaid: invoices.data
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.amount_paid, 0)
    };

  } catch (error) {
    console.error('Error retrieving subscription details:', error);
    throw error;
  }
};

// Handle failed rent payments with retry logic
export const handleFailedRentPayment = async (
  subscriptionId: string,
  invoiceId: string,
  options: {
    maxRetries?: number;
    applyLateFee?: boolean;
    lateFeeAmount?: number;
    notifyTenant?: boolean;
  } = {}
) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const invoice = await stripe.invoices.retrieve(invoiceId);

    console.log('Handling failed rent payment:', {
      subscriptionId,
      invoiceId,
      attemptCount: invoice.attempt_count,
      maxRetries: options.maxRetries || 3
    });

    // Apply late fee if specified
    if (options.applyLateFee && options.lateFeeAmount) {
      await stripe.invoiceItems.create({
        customer: subscription.customer as string,
        amount: options.lateFeeAmount,
        currency: subscription.currency || 'eur',
        description: 'Late payment fee',
        metadata: {
          type: 'late_fee',
          originalInvoice: invoiceId,
          subscriptionId
        }
      });
    }

    // Retry payment if under max retry limit
    const maxRetries = options.maxRetries || 3;
    if (invoice.attempt_count < maxRetries) {
      // Attempt to finalize the invoice again (triggers retry)
      await stripe.invoices.finalizeInvoice(invoiceId);

      console.log('Retrying failed payment:', {
        invoiceId,
        attemptCount: invoice.attempt_count + 1
      });
    } else {
      // Max retries reached, mark as uncollectible
      await stripe.invoices.markUncollectible(invoiceId);

      console.log('Marking invoice as uncollectible after max retries:', {
        invoiceId,
        attemptCount: invoice.attempt_count
      });
    }

    // TODO: Send notification to tenant and landlord
    if (options.notifyTenant) {
      // This would integrate with the notification system
      console.log('Sending payment failure notification to tenant');
    }

    return {
      success: true,
      action: invoice.attempt_count < maxRetries ? 'retry' : 'marked_uncollectible',
      remainingRetries: Math.max(0, maxRetries - invoice.attempt_count)
    };

  } catch (error) {
    console.error('Error handling failed rent payment:', error);
    throw error;
  }
};

// Create setup intent for saving payment methods
export const createSetupIntent = async (customerId: string) => {
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: 'off_session',
      payment_method_types: ['card'],
    });

    return setupIntent;
  } catch (error) {
    console.error('Error creating setup intent:', error);
    throw error;
  }
};

// Create or retrieve Stripe customer
export const createOrRetrieveCustomer = async (userId: string, email: string, name?: string) => {
  try {
    // First, try to find existing customer
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email: email,
      name: name,
      metadata: {
        userId: userId,
      },
    });

    return customer;
  } catch (error) {
    console.error('Error creating/retrieving customer:', error);
    throw error;
  }
};

// Calculate platform fee (5% of rent)
export const calculatePlatformFee = (rentAmount: number): number => {
  return Math.round(rentAmount * 0.05);
};

// Calculate total payment amount including fees
export const calculateTotalAmount = (baseAmount: number, includePlatformFee: boolean = true): number => {
  if (!includePlatformFee) return baseAmount;

  const platformFee = calculatePlatformFee(baseAmount);
  return baseAmount + platformFee;
};

// Format amount for display (convert cents to euros)
export const formatAmount = (amountInCents: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: currency,
  }).format(amountInCents / 100);
};

// Convert euros to cents for Stripe
export const eurosToCents = (euros: number): number => {
  return Math.round(euros * 100);
};

// Payment status helpers
export const getPaymentStatus = (paymentIntent: Stripe.PaymentIntent): string => {
  switch (paymentIntent.status) {
    case 'succeeded':
      return 'completed';
    case 'processing':
      return 'processing';
    case 'requires_payment_method':
    case 'requires_confirmation':
    case 'requires_action':
      return 'pending';
    case 'canceled':
      return 'cancelled';
    default:
      return 'failed';
  }
};

// Subscription status helpers
export const getSubscriptionStatus = (subscription: Stripe.Subscription): {
  status: string;
  displayName: string;
  isActive: boolean;
} => {
  switch (subscription.status) {
    case 'active':
      return {
        status: 'active',
        displayName: 'Active',
        isActive: true
      };
    case 'past_due':
      return {
        status: 'past_due',
        displayName: 'Payment Overdue',
        isActive: true
      };
    case 'canceled':
      return {
        status: 'canceled',
        displayName: 'Canceled',
        isActive: false
      };
    case 'unpaid':
      return {
        status: 'unpaid',
        displayName: 'Payment Failed',
        isActive: false
      };
    case 'paused':
      return {
        status: 'paused',
        displayName: 'Paused',
        isActive: false
      };
    default:
      return {
        status: subscription.status,
        displayName: subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1),
        isActive: false
      };
  }
};

// Late fee calculation
export const calculateLateFee = (rentAmount: number, daysLate: number): number => {
  // Greek standard: 5% of monthly rent as late fee after 5 days
  if (daysLate <= 5) return 0;

  const baseFee = Math.round(rentAmount * 0.05);

  // Additional fee for each week late (max 20% of rent)
  const additionalWeeks = Math.floor((daysLate - 5) / 7);
  const additionalFee = Math.round(rentAmount * 0.02 * additionalWeeks);

  const totalFee = baseFee + additionalFee;
  const maxFee = Math.round(rentAmount * 0.20); // Cap at 20% of rent

  return Math.min(totalFee, maxFee);
};
