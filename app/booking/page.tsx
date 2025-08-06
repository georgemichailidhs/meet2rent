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
  Eye
} from 'lucide-react';
import Link from 'next/link';

interface Booking {
  id: number;
  property: {
    id: number;
    title: string;
    location: string;
    price: number;
    image: string;
  };
  landlord: {
    name: string;
    phone: string;
    email: string;
  };
  viewingDate: string;
  viewingTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  requestDate: string;
  message?: string;
  notes?: string;
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
  applicationDate: string;
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn';
  landlordFeedback?: string;
  documentStatus: {
    idDocument: boolean;
    incomeProof: boolean;
    references: boolean;
    creditCheck: boolean;
  };
}

const mockBookings: Booking[] = [
  {
    id: 1,
    property: {
      id: 1,
      title: 'Modern 2BR Apartment',
      location: 'Kolonaki, Athens',
      price: 1000,
      image: '/api/placeholder/300/200'
    },
    landlord: {
      name: 'Maria Konstantinou',
      phone: '+30 210 123 4567',
      email: 'maria@email.com'
    },
    viewingDate: '2024-03-20',
    viewingTime: '14:00',
    status: 'confirmed',
    requestDate: '2024-03-15',
    message: 'Looking forward to seeing the apartment. I\'m available for flexible timing.'
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
    landlord: {
      name: 'Dimitris Papadopoulos',
      phone: '+30 210 987 6543',
      email: 'dimitris@email.com'
    },
    viewingDate: '2024-03-18',
    viewingTime: '10:00',
    status: 'completed',
    requestDate: '2024-03-10',
    notes: 'Viewing completed. Decided to apply for this property.'
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
    landlord: {
      name: 'John Smith',
      phone: '+30 210 555 0123',
      email: 'john@email.com'
    },
    viewingDate: '2024-03-25',
    viewingTime: '16:00',
    status: 'pending',
    requestDate: '2024-03-16',
    message: 'Interested in long-term rental. Family with one child.'
  }
];

const mockApplications: Application[] = [
  {
    id: 1,
    property: {
      id: 2,
      title: 'Student Studio Near University',
      location: 'Exarchia, Athens',
      price: 450,
      image: '/api/placeholder/300/200'
    },
    applicationDate: '2024-03-18',
    status: 'under_review',
    documentStatus: {
      idDocument: true,
      incomeProof: true,
      references: true,
      creditCheck: false
    }
  },
  {
    id: 2,
    property: {
      id: 4,
      title: 'Digital Nomad Friendly Loft',
      location: 'Psyrri, Athens',
      price: 800,
      image: '/api/placeholder/300/200'
    },
    applicationDate: '2024-03-12',
    status: 'accepted',
    landlordFeedback: 'Perfect tenant profile! Looking forward to having you.',
    documentStatus: {
      idDocument: true,
      incomeProof: true,
      references: true,
      creditCheck: true
    }
  }
];

export default function BookingPage() {
  const [activeTab, setActiveTab] = useState<'viewings' | 'applications'>('viewings');
  const [filterStatus, setFilterStatus] = useState<string>('all');

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

  const filteredBookings = filterStatus === 'all'
    ? mockBookings
    : mockBookings.filter(booking => booking.status === filterStatus);

  const filteredApplications = filterStatus === 'all'
    ? mockApplications
    : mockApplications.filter(app => app.status === filterStatus);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings & Applications</h1>
          <p className="text-gray-600 mt-2">Manage your property viewings and rental applications</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-200 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('viewings')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'viewings'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="h-4 w-4 inline mr-2" />
            Viewings ({mockBookings.length})
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
            Applications ({mockApplications.length})
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
              {activeTab === 'viewings' ? (
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
                  <option value="withdrawn">Withdrawn</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'viewings' ? (
          /* Viewings Tab */
          <div className="space-y-6">
            {filteredBookings.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No viewings found</h3>
                <p className="text-gray-500 mb-4">
                  {filterStatus === 'all'
                    ? "You haven't booked any property viewings yet."
                    : `No viewings with status "${filterStatus.replace('_', ' ')}".`
                  }
                </p>
                <Link href="/search">
                  <Button>Browse Properties</Button>
                </Link>
              </Card>
            ) : (
              filteredBookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-6">
                      {/* Property Image */}
                      <div className="bg-gray-200 w-32 h-24 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Home className="h-8 w-8 text-gray-400" />
                      </div>

                      {/* Property Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {booking.property.title}
                            </h3>
                            <div className="flex items-center text-gray-600 text-sm mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              {booking.property.location}
                            </div>
                            <div className="flex items-center text-green-600 font-semibold mt-1">
                              <Euro className="h-4 w-4 mr-1" />
                              {booking.property.price}/month
                            </div>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>

                        {/* Viewing Details */}
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Viewing Details</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                {new Date(booking.viewingDate).toLocaleDateString('en-GB')}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                {booking.viewingTime}
                              </div>
                              <div className="text-xs text-gray-500">
                                Requested: {new Date(booking.requestDate).toLocaleDateString('en-GB')}
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Landlord Contact</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                {booking.landlord.name}
                              </div>
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-2" />
                                {booking.landlord.phone}
                              </div>
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-2" />
                                {booking.landlord.email}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Message */}
                        {booking.message && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-1">Your Message</h4>
                            <p className="text-sm text-gray-600 italic">"{booking.message}"</p>
                          </div>
                        )}

                        {/* Notes */}
                        {booking.notes && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-1">Notes</h4>
                            <p className="text-sm text-gray-600">{booking.notes}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex space-x-3">
                          <Link href={`/property/${booking.property.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              View Property
                            </Button>
                          </Link>

                          {booking.status === 'pending' && (
                            <Button size="sm" variant="outline">
                              Cancel Request
                            </Button>
                          )}

                          {booking.status === 'confirmed' && (
                            <Button size="sm" variant="outline">
                              Reschedule
                            </Button>
                          )}

                          {booking.status === 'completed' && (
                            <Button size="sm">
                              Apply for Property
                            </Button>
                          )}

                          <Button size="sm" variant="outline">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message
                          </Button>
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
                <p className="text-gray-500 mb-4">
                  {filterStatus === 'all'
                    ? "You haven't submitted any rental applications yet."
                    : `No applications with status "${filterStatus.replace('_', ' ')}".`
                  }
                </p>
                <Link href="/search">
                  <Button>Browse Properties</Button>
                </Link>
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

                      {/* Application Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
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
                          {getStatusBadge(application.status)}
                        </div>

                        {/* Application Details */}
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Application Progress</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className={`flex items-center space-x-2 ${application.documentStatus.idDocument ? 'text-green-600' : 'text-gray-400'}`}>
                              {application.documentStatus.idDocument ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                              <span>ID Document</span>
                            </div>
                            <div className={`flex items-center space-x-2 ${application.documentStatus.incomeProof ? 'text-green-600' : 'text-gray-400'}`}>
                              {application.documentStatus.incomeProof ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                              <span>Income Proof</span>
                            </div>
                            <div className={`flex items-center space-x-2 ${application.documentStatus.references ? 'text-green-600' : 'text-gray-400'}`}>
                              {application.documentStatus.references ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                              <span>References</span>
                            </div>
                            <div className={`flex items-center space-x-2 ${application.documentStatus.creditCheck ? 'text-green-600' : 'text-gray-400'}`}>
                              {application.documentStatus.creditCheck ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                              <span>Credit Check</span>
                            </div>
                          </div>
                        </div>

                        {/* Application Date */}
                        <div className="mb-4">
                          <div className="text-sm text-gray-600">
                            Applied on: {new Date(application.applicationDate).toLocaleDateString('en-GB')}
                          </div>
                        </div>

                        {/* Landlord Feedback */}
                        {application.landlordFeedback && (
                          <div className="mb-4 p-3 bg-green-50 rounded-lg">
                            <h4 className="font-medium text-green-800 mb-1">Landlord Feedback</h4>
                            <p className="text-sm text-green-700">"{application.landlordFeedback}"</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex space-x-3">
                          <Link href={`/property/${application.property.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              View Property
                            </Button>
                          </Link>

                          {application.status === 'submitted' && (
                            <Button size="sm" variant="outline">
                              Update Documents
                            </Button>
                          )}

                          {application.status === 'accepted' && (
                            <Button size="sm">
                              Sign Contract
                            </Button>
                          )}

                          {(application.status === 'submitted' || application.status === 'under_review') && (
                            <Button size="sm" variant="destructive">
                              Withdraw Application
                            </Button>
                          )}

                          <Button size="sm" variant="outline">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contact Landlord
                          </Button>
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
