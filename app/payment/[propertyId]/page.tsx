'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Lock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Euro,
  Calendar,
  Home,
  Shield,
  Loader2,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  propertyId: string;
  paymentType: string;
  amount: number;
  contractId?: string;
  description?: string;
}

function PaymentForm({ propertyId, paymentType, amount, contractId, description }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    // Create payment intent
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amount,
            paymentType: paymentType,
            propertyId: propertyId,
            contractId: contractId,
            description: description,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setClientSecret(result.data.clientSecret);
        } else {
          const error = await response.json();
          setError(error.error || 'Failed to create payment intent');
        }
      } catch (error) {
        console.error('Error creating payment intent:', error);
        setError('Failed to initialize payment. Please try again.');
      }
    };

    createPaymentIntent();
  }, [amount, paymentType, propertyId, contractId, description]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Card element not found');
      setLoading(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: session?.user?.name || '',
          email: session?.user?.email || '',
        },
      },
    });

    if (error) {
      setError(error.message || 'Payment failed');
      setLoading(false);
    } else if (paymentIntent?.status === 'succeeded') {
      // Payment successful
      router.push(`/payment/success?payment_intent=${paymentIntent.id}`);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Details */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="p-4 border border-gray-300 rounded-lg bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800">Payment Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || loading || !clientSecret}
        className="w-full h-12 bg-blue-600 hover:bg-blue-700"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="h-5 w-5 mr-2" />
            Pay €{amount}
          </>
        )}
      </Button>

      {/* Security Notice */}
      <div className="text-center text-sm text-gray-600">
        <Lock className="h-4 w-4 inline mr-1" />
        Your payment is secured by Stripe. We never store your card details.
      </div>
    </form>
  );
}

export default function PaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const propertyId = params.propertyId as string;

  const paymentType = searchParams.get('type') || 'monthly_rent';
  const amount = Number(searchParams.get('amount')) || 0;
  const contractId = searchParams.get('contract_id') || undefined;
  const description = searchParams.get('description') || undefined;

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        // TODO: Fetch property details from API
        // For now using mock data
        setProperty({
          id: propertyId,
          title: 'Modern 2BR Apartment with City Views',
          address: '123 Kolonaki Street',
          city: 'Athens',
          mainImage: '/api/placeholder/300/200',
        });
      } catch (error) {
        console.error('Error fetching property:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  const getPaymentTitle = () => {
    switch (paymentType) {
      case 'security_deposit': return 'Security Deposit';
      case 'monthly_rent': return 'Monthly Rent';
      case 'platform_fee': return 'Platform Fee';
      case 'late_fee': return 'Late Fee';
      default: return 'Payment';
    }
  };

  const getPaymentDescription = () => {
    switch (paymentType) {
      case 'security_deposit':
        return 'Refundable deposit held for the duration of your lease';
      case 'monthly_rent':
        return 'Monthly rental payment for your property';
      case 'platform_fee':
        return 'One-time Meet2Rent service fee for contract processing';
      case 'late_fee':
        return 'Late payment fee for overdue rent';
      default:
        return description || 'Payment for rental services';
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Required</h1>
            <p className="text-gray-600 mb-6">Please sign in to continue with your payment.</p>
            <Link href="/auth/signin">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-semibold mb-2">Loading Payment Details...</h3>
          <p className="text-gray-600">Please wait while we prepare your payment</p>
        </div>
      </div>
    );
  }

  if (!amount || amount <= 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Payment</h1>
            <p className="text-gray-600 mb-6">The payment amount is invalid or missing.</p>
            <Link href="/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Secure Payment</h1>
          <p className="text-gray-600 mt-2">Complete your payment to continue</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise}>
                  <PaymentForm
                    propertyId={propertyId}
                    paymentType={paymentType}
                    amount={amount}
                    contractId={contractId}
                    description={description}
                  />
                </Elements>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div className="space-y-6">
            {/* Property Info */}
            {property && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Property</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                      {property.mainImage ? (
                        <img
                          src={property.mainImage}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{property.title}</h3>
                      <p className="text-sm text-gray-600">{property.address}, {property.city}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{getPaymentTitle()}</span>
                  <span className="font-semibold">€{amount}</span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span className="text-green-600">€{amount}</span>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <p>{getPaymentDescription()}</p>
                </div>

                {contractId && (
                  <div className="text-sm">
                    <span className="text-gray-600">Contract ID:</span>
                    <span className="ml-1 font-mono">{contractId}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Features */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Secure Payment</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• 256-bit SSL encryption</li>
                      <li>• PCI DSS compliant</li>
                      <li>• Powered by Stripe</li>
                      <li>• No card details stored</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Receipt Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Receipt className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Receipt & Documentation</h4>
                    <p className="text-sm text-gray-600">
                      You'll receive an email receipt immediately after payment.
                      Payment records are available in your dashboard.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
