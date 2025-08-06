'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  Download,
  Mail,
  MessageSquare,
  Calendar,
  Home,
  Euro,
  FileText,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  const paymentIntentId = searchParams.get('payment_intent');
  const propertyId = searchParams.get('property_id');

  useEffect(() => {
    if (!paymentIntentId) {
      router.push('/');
      return;
    }

    // TODO: Fetch payment details from API
    // For now, using mock data
    setPaymentDetails({
      id: paymentIntentId,
      amount: 1050, // €1050 (€1000 rent + €50 platform fee)
      paymentType: 'security_deposit',
      propertyTitle: 'Modern 2BR Apartment with City Views',
      propertyLocation: 'Kolonaki, Athens',
      landlordName: 'Maria Konstantinou',
      date: new Date().toISOString(),
      receiptUrl: '#',
      nextSteps: [
        {
          title: 'Digital Contract Signing',
          description: 'Your lease agreement will be sent within 24 hours',
          action: 'contracts',
          completed: false
        },
        {
          title: 'Key Collection Appointment',
          description: 'Schedule with your landlord for key handover',
          action: 'schedule',
          completed: false
        },
        {
          title: 'Move-in Inspection',
          description: 'Document property condition before moving in',
          action: 'inspection',
          completed: false
        }
      ]
    });
    setIsLoading(false);
  }, [paymentIntentId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  if (!paymentDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Not Found</h1>
            <p className="text-gray-600 mb-6">We couldn't find the payment details.</p>
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPaymentTypeLabel = (type: string) => {
    const labels = {
      security_deposit: 'Security Deposit',
      monthly_rent: 'Monthly Rent',
      platform_fee: 'Platform Fee',
      late_fee: 'Late Fee'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-green-700 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 text-lg">
            Your {getPaymentTypeLabel(paymentDetails.paymentType).toLowerCase()} has been processed successfully.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Summary */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-green-800">
                      {getPaymentTypeLabel(paymentDetails.paymentType)}
                    </h3>
                    <p className="text-sm text-green-600">
                      Payment ID: {paymentDetails.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-700">
                      €{paymentDetails.amount}
                    </div>
                    <p className="text-sm text-green-600">
                      {new Date(paymentDetails.date).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Property Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Home className="h-4 w-4 mr-2 text-gray-500" />
                      {paymentDetails.propertyTitle}
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">📍</span>
                      {paymentDetails.propertyLocation}
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">👤</span>
                      Landlord: {paymentDetails.landlordName}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Receipt
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>What Happens Next?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentDetails.nextSteps.map((step: any, index: number) => (
                    <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className={`rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold ${
                        step.completed ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {step.completed ? '✓' : index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{step.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                        {!step.completed && (
                          <Button size="sm" variant="outline">
                            {step.action === 'contracts' && 'View Contracts'}
                            {step.action === 'schedule' && 'Schedule Appointment'}
                            {step.action === 'inspection' && 'Start Inspection'}
                            <ArrowRight className="h-3 w-3 ml-2" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message Landlord
                </Button>
                <Button className="w-full" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Move-in
                </Button>
                <Link href={`/property/${propertyId}`}>
                  <Button className="w-full" variant="outline">
                    <Home className="h-4 w-4 mr-2" />
                    View Property
                  </Button>
                </Link>
                <Link href="/dashboard/tenant">
                  <Button className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  If you have any questions about your payment or next steps,
                  our support team is here to help.
                </p>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Live Chat Support
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Support
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Security */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-800 mb-1">Secure Transaction</h4>
                    <p className="text-sm text-green-700">
                      Your payment was processed securely through Stripe with
                      bank-level encryption and fraud protection.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Important Notice */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-800 mb-2">Important Notice</h3>
            <p className="text-blue-700 text-sm">
              Keep this confirmation for your records. You will receive an email confirmation
              shortly with all payment details and next steps. If you don't receive the email
              within 15 minutes, please check your spam folder or contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
