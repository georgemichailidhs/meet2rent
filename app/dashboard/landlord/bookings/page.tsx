'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Euro,
  Home,
  Filter,
  Eye,
  Check,
  X,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';

interface BookingRequest {
  id: number;
  property: {
    id: number;
    title: string;
    location: string;
    price: number;
    image: string;
  };
  tenant: {
    id: string;
    name: string;
    email: string;
    phone: string;
    rating: number;
    verified: boolean;
    joinedDate: string;
  };
  requestedDate: string;
  requestedTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  tenantMessage: string;
  requestDate: string;
  urgency: 'low' | 'medium' | 'high';
}

interface Application {
  id: number;
  property: {
    id: number;
    title: string;
    location: string;
    price: number;
    image: string;
  };
  tenant: {
    id: string;
    name: string;
    email: string;
    phone: string;
    rating: number;
    verified: boolean;
    occupation: string;
    monthlyIncome: number;
  };
  applicationDate: string;
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn';
  coverLetter: string;
  moveInDate: string;
  leaseDuration: number;
  documentStatus: {
    idDocument: boolean;
    incomeProof: boolean;
    references: boolean;
    creditCheck: boolean;
  };
  score: number; // calculated tenant score
}

const mockBookingRequests: BookingRequest[] = [
  {
    id: 1,
    property: {
      id: 1,
      title: 'Modern 2BR Apartment',
      location: 'Kolonaki, Athens',
      price: 1000,
      image: '/api/placeholder/300/200'
    },
    tenant: {
      id: 'tenant1',
      name: 'Anna Papadopoulos',
      email: 'anna@email.com',
      phone: '+30 210 555 0101',
      rating: 4.8,
      verified: true,
      joinedDate: '2024-01-15'
    },
    requestedDate: '2024-03-22',
    requestedTime: '15:00',
    status: 'pending',
    tenantMessage: 'Hi! I\'m very interested in this apartment. I work as a software engineer and I\'m looking for a long-term rental. I\'m available for viewing this Friday afternoon.',
    requestDate: '2024-03-18',
    urgency: 'high'
  },
  {
    id: 2,
    property: {
      id: 2,
      title: 'Student Studio Near University',
      location: 'Exarchia, Athens',
      price: 450,
      image: '/api/placeholder/300/200'
    },
    tenant: {
      id: 'tenant2',
      name: 'Dimitris Kostas',
      email: 'dimitris@email.com',
      phone: '+30 210 555 0102',
      rating: 4.2,
      verified: true,
      joinedDate: '2024-02-20'
    },
    requestedDate: '2024-03-20',
    requestedTime: '10:00',
    status: 'pending',
    tenantMessage: 'Hello! I\'m a university student looking for accommodation near my campus. This studio looks perfect for my needs.',
    requestDate: '2024-03-17',
    urgency: 'medium'
  },
  {
    id: 3,
    property: {
      id: 3,
      title: 'Family House with Garden',
      location: 'Kifissia, Athens',
      price: 1500,
      image: '/api/placeholder/300/200'
    },
    tenant: {
      id: 'tenant3',
      name: 'Maria Georgiou',
      email: 'maria@email.com',
      phone: '+30 210 555 0103',
      rating: 4.9,
      verified: true,
      joinedDate: '2023-11-10'
    },
    requestedDate: '2024-03-25',
    requestedTime: '16:30',
    status: 'confirmed',
    tenantMessage: 'We are a family of three looking for a house with a garden. This property seems ideal for us. We have excellent references from our previous landlord.',
    requestDate: '2024-03-16',
    urgency: 'low'
  }
];

const mockApplications: Application[] = [
  {
    id: 1,
    property: {
      id: 4,
      title: 'Digital Nomad Friendly Loft',
      location: 'Psyrri, Athens',
      price: 800,
      image: '/api/placeholder/300/200'
    },
    tenant: {
      id: 'tenant4',
      name: 'John Smith',
      email: 'john@email.com',
      phone: '+30 210 555 0104',
      rating: 4.7,
      verified: true,
      occupation: 'Freelance Designer',
      monthlyIncome: 3200
    },
    applicationDate: '2024-03-15',
    status: 'under_review',
    coverLetter: 'I am a freelance graphic designer who works remotely. I have been living in Athens for 2 years and am looking for a creative space that can serve as both my home and workspace. I have stable income and excellent references.',
    moveInDate: '2024-04-01',
    leaseDuration: 12,
    documentStatus: {
      idDocument: true,
      incomeProof: true,
      references: true,
      creditCheck: false
    },
    score: 85
  },
  {
    id: 2,
    property: {
      id: 1,
      title: 'Modern 2BR Apartment',
      location: 'Kolonaki, Athens',
      price: 1000,
      image: '/api/placeholder/300/200'
    },
    tenant: {
      id: 'tenant5',
      name: 'Elena Dimitriou',
      email: 'elena@email.com',
      phone: '+30 210 555 0105',
      rating: 4.6,
      verified: true,
      occupation: 'Marketing Manager',
      monthlyIncome: 4500
    },
    applicationDate: '2024-03-12',
    status: 'submitted',
    coverLetter: 'I work as a marketing manager for an international company. I am looking for a modern apartment in a central location. I am a responsible tenant with no history of late payments.',
    moveInDate: '2024-04-15',
    leaseDuration: 18,
    documentStatus: {
      idDocument: true,
      incomeProof: true,
      references: false,
      creditCheck: true
    },
    score: 92
  }
];

export default function LandlordBookingsPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'applications'>('requests');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, color: 'text-yellow-600', icon: AlertCircle },
      confirmed: { variant: 'default' as const, color: 'text-green-600', icon: CheckCircle },
      completed: { variant: 'secondary' as const, color: 'text-blue-600', icon: CheckCircle },
      cancelled: { variant: 'destructive' as const, color: 'text-red-600', icon: XCircle },
      rejected: { variant: 'destructive' as const, color: 'text-red-600', icon: XCircle },
      submitted: { variant: 'secondary' as const, color: 'text-blue-600', icon: Clock },
      under_review: { variant: 'secondary' as const, color: 'text-yellow-600', icon: Clock },
      accepted: { variant: 'default' as const, color: 'text-green-600', icon: CheckCircle },
      withdrawn: { variant: 'outline' as const, color: 'text-gray-600', icon: XCircle }
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

  const getUrgencyBadge = (urgency: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return (
      <Badge className={colors[urgency as keyof typeof colors]}>
        {urgency.toUpperCase()}
      </Badge>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleAcceptBooking = async (bookingId: number) => {
    // TODO: API call to accept booking
    console.log('Accepting booking:', bookingId);
  };

  const handleRejectBooking = async (bookingId: number) => {
    // TODO: API call to reject booking
    console.log('Rejecting booking:', bookingId);
  };

  const handleAcceptApplication = async (applicationId: number) => {
    // TODO: API call to accept application
    console.log('Accepting application:', applicationId);
  };

  const handleRejectApplication = async (applicationId: number) => {
    // TODO: API call to reject application
    console.log('Rejecting application:', applicationId);
  };

  const filteredRequests = filterStatus === 'all'
    ? mockBookingRequests
    : mockBookingRequests.filter(request => request.status === filterStatus);

  const filteredApplications = filterStatus === 'all'
    ? mockApplications
    : mockApplications.filter(app => app.status === filterStatus);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Booking Requests & Applications</h1>
          <p className="text-gray-600 mt-2">Manage viewing requests and tenant applications</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-200 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'requests'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="h-4 w-4 inline mr-2" />
            Viewing Requests ({mockBookingRequests.filter(r => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'applications'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Home className="h-4 w-4 inline mr-2" />
            Applications ({mockApplications.filter(a => a.status === 'under_review').length})
          </button>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              {activeTab === 'requests' ? (
                <>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </>
              ) : (
                <>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'requests' ? (
          /* Viewing Requests Tab */
          <div className="space-y-6">
            {filteredRequests.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No viewing requests</h3>
                <p className="text-gray-500">
                  No viewing requests match your current filter.
                </p>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-6">
                      {/* Property Image */}
                      <div className="bg-gray-200 w-32 h-24 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Home className="h-8 w-8 text-gray-400" />
                      </div>

                      {/* Request Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {request.property.title}
                            </h3>
                            <div className="flex items-center text-gray-600 text-sm mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              {request.property.location}
                            </div>
                            <div className="flex items-center text-green-600 font-semibold mt-1">
                              <Euro className="h-4 w-4 mr-1" />
                              {request.property.price}/month
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {getStatusBadge(request.status)}
                            {getUrgencyBadge(request.urgency)}
                          </div>
                        </div>

                        {/* Tenant Info */}
                        <div className="grid md:grid-cols-2 gap-6 mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Tenant Information</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center">
                                  <User className="h-4 w-4 mr-2" />
                                  {request.tenant.name}
                                </span>
                                {request.tenant.verified && (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-2" />
                                {request.tenant.email}
                              </div>
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-2" />
                                {request.tenant.phone}
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Rating: ⭐ {request.tenant.rating}</span>
                                <span className="text-gray-500">
                                  Joined: {new Date(request.tenant.joinedDate).toLocaleDateString('en-GB')}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Requested Viewing</h4>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                {new Date(request.requestedDate).toLocaleDateString('en-GB')}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                {request.requestedTime}
                              </div>
                              <div className="text-xs text-gray-500">
                                Requested: {new Date(request.requestDate).toLocaleDateString('en-GB')}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Tenant Message */}
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Tenant Message</h4>
                          <p className="text-sm text-gray-700 italic bg-gray-50 p-3 rounded-lg">
                            "{request.tenantMessage}"
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-3">
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleAcceptBooking(request.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Accept Request
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectBooking(request.id)}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Decline
                              </Button>
                            </>
                          )}

                          <Button size="sm" variant="outline">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message Tenant
                          </Button>

                          <Link href={`/property/${request.property.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              View Property
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          /* Applications Tab */
          <div className="space-y-6">
            {filteredApplications.length === 0 ? (
              <Card className="p-12 text-center">
                <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No applications found</h3>
                <p className="text-gray-500">
                  No applications match your current filter.
                </p>
              </Card>
            ) : (
              filteredApplications.map((application) => (
                <Card key={application.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-6">
                      {/* Property Image */}
                      <div className="bg-gray-200 w-32 h-24 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Home className="h-8 w-8 text-gray-400" />
                      </div>

                      {/* Application Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {application.property.title}
                            </h3>
                            <div className="flex items-center text-gray-600 text-sm mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              {application.property.location}
                            </div>
                            <div className="flex items-center text-green-600 font-semibold mt-1">
                              <Euro className="h-4 w-4 mr-1" />
                              {application.property.price}/month
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {getStatusBadge(application.status)}
                            <div className={`font-bold text-lg ${getScoreColor(application.score)}`}>
                              {application.score}/100
                            </div>
                          </div>
                        </div>

                        {/* Tenant Information */}
                        <div className="grid md:grid-cols-2 gap-6 mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Applicant Information</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center">
                                  <User className="h-4 w-4 mr-2" />
                                  {application.tenant.name}
                                </span>
                                {application.tenant.verified && (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                              <div className="flex items-center">
                                <span className="text-gray-600">Occupation:</span>
                                <span className="ml-2 font-medium">{application.tenant.occupation}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-gray-600">Monthly Income:</span>
                                <span className="ml-2 font-medium text-green-600">
                                  €{application.tenant.monthlyIncome.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Rating: ⭐ {application.tenant.rating}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Application Details</h4>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center justify-between">
                                <span>Move-in date:</span>
                                <span>{new Date(application.moveInDate).toLocaleDateString('en-GB')}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Lease duration:</span>
                                <span>{application.leaseDuration} months</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                Applied: {new Date(application.applicationDate).toLocaleDateString('en-GB')}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Document Status */}
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Document Verification</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {Object.entries(application.documentStatus).map(([key, status]) => (
                              <div key={key} className={`flex items-center space-x-2 ${status ? 'text-green-600' : 'text-gray-400'}`}>
                                {status ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Cover Letter */}
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Cover Letter</h4>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                            {application.coverLetter}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-3">
                          {(application.status === 'submitted' || application.status === 'under_review') && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleAcceptApplication(application.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Accept Application
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectApplication(application.id)}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </>
                          )}

                          <Button size="sm" variant="outline">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message Applicant
                          </Button>

                          <Button size="sm" variant="outline">
                            <User className="h-4 w-4 mr-2" />
                            View Full Profile
                          </Button>

                          <Link href={`/property/${application.property.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              View Property
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
