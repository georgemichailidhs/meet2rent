'use client';

import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Shield,
  CheckCircle,
  AlertCircle,
  Euro,
  Clock,
  Building,
  MapPin
} from 'lucide-react';
import { formatAmount, type PaymentType } from '@/lib/stripe';

interface PaymentFormProps {
  clientSecret: string;
  paymentIntentId: string;
  amount: number; // in cents
  paymentType: PaymentType;
  propertyTitle: string;
  propertyLocation: string;
  landlordName: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

const paymentTypeLabels = {
  security_deposit: 'Security Deposit',
  monthly_rent: 'Monthly Rent',
  platform_fee: 'Platform Fee',
  late_fee: 'Late Fee'
};

const paymentTypeColors = {
  security_deposit: 'bg-blue-500',
  monthly_rent: 'bg-green-500',
  platform_fee: 'bg-purple-500',
  late_fee: 'bg-red-500'
};

export default function PaymentForm({
  clientSecret,
  paymentIntentId,
  amount,
  paymentType,
  propertyTitle,
  propertyLocation,
  landlordName,
  onSuccess,
  onError
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?payment_intent=${paymentIntentId}`,
        },
        redirect: 'if_required'
      });

      if (error) {
        setPaymentStatus('error');
        setErrorMessage(error.message || 'Payment failed');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setPaymentStatus('success');
        onSuccess(paymentIntent.id);
      }
    } catch (error) {
      setPaymentStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Payment failed';
      setErrorMessage(errorMsg);
      onError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (paymentStatus === 'success') {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-700 mb-2">Payment Successful!</h3>
          <p className="text-gray-600 mb-4">
            Your {paymentTypeLabels[paymentType].toLowerCase()} has been processed successfully.
          </p>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-800">
              Payment ID: {paymentIntentId}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </CardTitle>
            <Badge className={paymentTypeColors[paymentType]}>
              {paymentTypeLabels[paymentType]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Property Info */}
          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">{propertyTitle}</h4>
              <div className="flex items-center text-gray-600 text-sm mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                {propertyLocation}
              </div>
              <p className="text-sm text-gray-600 mt-1">Landlord: {landlordName}</p>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <h4 className="font-semibold text-green-800">Total Amount</h4>
              <p className="text-sm text-green-600">Includes platform fees</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-700">
                {formatAmount(amount)}
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Secure Payment</h4>
              <p className="text-sm text-blue-700">
                Your payment is secured by Stripe with bank-level encryption.
                Your card details are never stored on our servers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>
            Enter your payment details to complete the transaction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Stripe Payment Element */}
            <div className="p-4 border rounded-lg">
              <PaymentElement
                options={{
                  layout: 'tabs',
                  paymentMethodOrder: ['card', 'ideal', 'sepa_debit']
                }}
              />
            </div>

            {/* Error Message */}
            {paymentStatus === 'error' && errorMessage && (
              <div className="flex items-center space-x-2 p-4 bg-red-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-red-700 text-sm">{errorMessage}</p>
              </div>
            )}

            {/* Payment Terms */}
            <div className="text-xs text-gray-600 space-y-2">
              <p>
                By proceeding with this payment, you agree to Meet2Rent's{' '}
                <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>{' '}
                and{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
              </p>
              {paymentType === 'security_deposit' && (
                <p>
                  Security deposits are held in escrow and will be returned according to
                  the lease agreement terms, minus any applicable deductions.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!stripe || !elements || isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay {formatAmount(amount)}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Payment Timeline */}
      {paymentType === 'security_deposit' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What happens next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center mt-0.5">
                  <span className="text-blue-600 font-semibold text-xs">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Payment Confirmation</h4>
                  <p className="text-sm text-gray-600">You'll receive an email confirmation immediately</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center mt-0.5">
                  <span className="text-blue-600 font-semibold text-xs">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Lease Activation</h4>
                  <p className="text-sm text-gray-600">Your lease will be activated and move-in details sent</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center mt-0.5">
                  <span className="text-blue-600 font-semibold text-xs">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Key Handover</h4>
                  <p className="text-sm text-gray-600">Coordinate with your landlord for key collection</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
