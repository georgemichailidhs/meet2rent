'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Euro,
  Calendar,
  Home,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Plus,
  MapPin,
  User,
  Filter,
  Search
} from 'lucide-react';
import Link from 'next/link';

interface Payment {
  id: string;
  propertyId: number;
  propertyTitle: string;
  propertyLocation: string;
  landlordName: string;
  amount: number;
  type: 'monthly_rent' | 'security_deposit' | 'platform_fee' | 'late_fee';
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  dueDate: Date;
  paidDate?: Date;
  description: string;
  receiptUrl?: string;
}

interface ActiveLease {
  id: string;
  propertyId: number;
  propertyTitle: string;
  propertyLocation: string;
  landlordName: string;
  monthlyRent: number;
  nextPaymentDue: Date;
  leaseStart: Date;
  leaseEnd: Date;
  status: 'active' | 'ending_soon' | 'overdue';
}

const mockActiveLeases: ActiveLease[] = [
  {
    id: 'lease-001',
    propertyId: 1,
    propertyTitle: 'Modern 2BR Apartment with City Views',
    propertyLocation: 'Kolonaki, Athens',
    landlordName: 'Maria Konstantinou',
    monthlyRent: 1000,
    nextPaymentDue: new Date('2024-04-01'),
    leaseStart: new Date('2024-01-01'),
    leaseEnd: new Date('2025-01-01'),
    status: 'active'
  }
];

const mockPayments: Payment[] = [
  {
    id: 'pay-001',
    propertyId: 1,
    propertyTitle: 'Modern 2BR Apartment',
    propertyLocation: 'Kolonaki, Athens',
    landlordName: 'Maria Konstantinou',
    amount: 1000,
    type: 'monthly_rent',
    status: 'completed',
    dueDate: new Date('2024-03-01'),
    paidDate: new Date('2024-02-28'),
    description: 'March 2024 Rent Payment',
    receiptUrl: '#'
  },
  {
    id: 'pay-002',
    propertyId: 1,
    propertyTitle: 'Modern 2BR Apartment',
    propertyLocation: 'Kolonaki, Athens',
    landlordName: 'Maria Konstantinou',
    amount: 1000,
    type: 'security_deposit',
    status: 'completed',
    dueDate: new Date('2024-01-01'),
    paidDate: new Date('2023-12-28'),
    description: 'Security Deposit',
    receiptUrl: '#'
  },
  {
    id: 'pay-003',
    propertyId: 1,
    propertyTitle: 'Modern 2BR Apartment',
    propertyLocation: 'Kolonaki, Athens',
    landlordName: 'Maria Konstantinou',
    amount: 1000,
    type: 'monthly_rent',
    status: 'pending',
    dueDate: new Date('2024-04-01'),
    description: 'April 2024 Rent Payment'
  },
  {
    id: 'pay-004',
    propertyId: 1,
    propertyTitle: 'Modern 2BR Apartment',
    propertyLocation: 'Kolonaki, Athens',
    landlordName: 'Maria Konstantinou',
    amount: 50,
    type: 'platform_fee',
    status: 'completed',
    dueDate: new Date('2024-01-01'),
    paidDate: new Date('2023-12-28'),
    description: 'Platform Fee',
    receiptUrl: '#'
  }
];

export default function TenantPaymentsPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: { variant: 'default' as const, color: 'text-green-600', icon: CheckCircle },
      pending: { variant: 'secondary' as const, color: 'text-yellow-600', icon: Clock },
      failed: { variant: 'destructive' as const, color: 'text-red-600', icon: AlertCircle },
      cancelled: { variant: 'outline' as const, color: 'text-gray-600', icon: AlertCircle },
      active: { variant: 'default' as const, color: 'text-green-600', icon: CheckCircle },
      ending_soon: { variant: 'secondary' as const, color: 'text-yellow-600', icon: Clock },
      overdue: { variant: 'destructive' as const, color: 'text-red-600', icon: AlertCircle }
    };

    const config = variants[status as keyof typeof variants];
    if (!config) return null;

    const Icon = config.icon;
    const label = status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getPaymentTypeLabel = (type: string) => {
    const labels = {
      monthly_rent: 'Monthly Rent',
      security_deposit: 'Security Deposit',
      platform_fee: 'Platform Fee',
      late_fee: 'Late Fee'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredPayments = mockPayments.filter(payment => {
    const matchesSearch = searchQuery === '' ||
      payment.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600 mt-2">Manage your rent payments and payment history</p>
        </div>

        {/* Active Leases Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Leases</h2>
          <div className="grid gap-6">
            {mockActiveLeases.map((lease) => {
              const daysUntilDue = getDaysUntilDue(lease.nextPaymentDue);
              const isOverdue = daysUntilDue < 0;
              const isDueSoon = daysUntilDue <= 5 && daysUntilDue >= 0;

              return (
                <Card key={lease.id} className={`${isOverdue ? 'border-red-200 bg-red-50' : isDueSoon ? 'border-yellow-200 bg-yellow-50' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center">
                          <Home className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">
                            {lease.propertyTitle}
                          </h3>
                          <div className="flex items-center text-gray-600 text-sm mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {lease.propertyLocation}
                          </div>
                          <div className="flex items-center text-gray-600 text-sm">
                            <User className="h-4 w-4 mr-1" />
                            Landlord: {lease.landlordName}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(lease.status)}
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-green-600">€{lease.monthlyRent}</div>
                        <div className="text-sm text-gray-600">Monthly Rent</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className={`text-2xl font-bold ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : 'text-gray-900'}`}>
                          {isOverdue ? `${Math.abs(daysUntilDue)} days` : daysUntilDue === 0 ? 'Today' : `${daysUntilDue} days`}
                        </div>
                        <div className="text-sm text-gray-600">
                          {isOverdue ? 'Overdue' : 'Until Due'}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-blue-600">
                          {lease.nextPaymentDue.toLocaleDateString('en-GB')}
                        </div>
                        <div className="text-sm text-gray-600">Next Payment</div>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Link href={`/payment/${lease.propertyId}?type=monthly_rent&amount=${lease.monthlyRent}&lease_id=${lease.id}`}>
                        <Button className={isOverdue ? 'bg-red-600 hover:bg-red-700' : isDueSoon ? 'bg-yellow-600 hover:bg-yellow-700' : ''}>
                          <CreditCard className="h-4 w-4 mr-2" />
                          {isOverdue ? 'Pay Overdue Rent' : 'Pay Rent'}
                        </Button>
                      </Link>
                      <Button variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        Set up Auto-Pay
                      </Button>
                      <Link href={`/property/${lease.propertyId}`}>
                        <Button variant="outline">
                          <Home className="h-4 w-4 mr-2" />
                          View Property
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-200 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'active'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="h-4 w-4 inline mr-2" />
            Upcoming Payments
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CheckCircle className="h-4 w-4 inline mr-2" />
            Payment History
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search payments..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Payment History */}
        <div className="space-y-4">
          {filteredPayments.length === 0 ? (
            <Card className="p-12 text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No payments found</h3>
              <p className="text-gray-500">
                {filterStatus === 'all'
                  ? "You don't have any payment records yet."
                  : `No payments with status "${filterStatus}".`
                }
              </p>
            </Card>
          ) : (
            filteredPayments.map((payment) => (
              <Card key={payment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="bg-gray-200 w-12 h-12 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-gray-400" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {payment.description}
                            </h3>
                            <div className="flex items-center text-gray-600 text-sm mt-1">
                              <Home className="h-4 w-4 mr-1" />
                              {payment.propertyTitle}
                            </div>
                            <div className="flex items-center text-gray-600 text-sm">
                              <MapPin className="h-4 w-4 mr-1" />
                              {payment.propertyLocation}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              €{payment.amount}
                            </div>
                            <Badge variant="outline" className="mt-1">
                              {getPaymentTypeLabel(payment.type)}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Due Date:</span>
                            <div className="font-medium">
                              {payment.dueDate.toLocaleDateString('en-GB')}
                            </div>
                          </div>
                          {payment.paidDate && (
                            <div>
                              <span className="text-gray-600">Paid Date:</span>
                              <div className="font-medium">
                                {payment.paidDate.toLocaleDateString('en-GB')}
                              </div>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <div className="mt-1">
                              {getStatusBadge(payment.status)}
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-3 mt-4">
                          {payment.status === 'pending' && (
                            <Link href={`/payment/${payment.propertyId}?type=${payment.type}&amount=${payment.amount}&payment_id=${payment.id}`}>
                              <Button size="sm">
                                <CreditCard className="h-4 w-4 mr-2" />
                                Pay Now
                              </Button>
                            </Link>
                          )}

                          {payment.receiptUrl && payment.status === 'completed' && (
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              Download Receipt
                            </Button>
                          )}

                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Payment Summary */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-blue-600" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  €{mockPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)}
                </div>
                <div className="text-sm text-blue-700">Total Paid</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  €{mockPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)}
                </div>
                <div className="text-sm text-yellow-700">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {mockPayments.filter(p => p.status === 'completed').length}
                </div>
                <div className="text-sm text-green-700">Completed Payments</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  €{mockActiveLeases.reduce((sum, l) => sum + l.monthlyRent, 0)}
                </div>
                <div className="text-sm text-purple-700">Monthly Rent</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
