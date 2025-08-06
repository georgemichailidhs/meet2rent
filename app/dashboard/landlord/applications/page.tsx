'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  User,
  Calendar,
  Euro,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MessageSquare,
  Shield,
  Users,
  Home,
  RefreshCw,
  Filter,
  Search,
  FileSignature,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface Application {
  id: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  moveInDate: Date;
  leaseDuration: number;
  monthlyIncome: string;
  hasGuarantor: boolean;
  guarantorInfo?: any;
  previousRentalHistory?: any;
  references?: any;
  coverLetter: string;
  additionalInfo?: string;
  reviewedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    monthlyRent: string;
    securityDeposit: string;
    mainImage?: string;
  };
  applicant: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export default function LandlordApplicationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'under_review' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchApplications();
    }
  }, [session, filter]);

  const fetchApplications = async () => {
    try {
      const queryParams = new URLSearchParams({
        userType: 'landlord',
        ...(filter !== 'all' && { status: filter }),
      });

      const response = await fetch(`/api/applications?${queryParams}`);
      if (response.ok) {
        const result = await response.json();
        setApplications(result.data.applications.map((app: any) => ({
          ...app,
          moveInDate: new Date(app.moveInDate),
          createdAt: new Date(app.createdAt),
          reviewedAt: app.reviewedAt ? new Date(app.reviewedAt) : undefined,
          approvedAt: app.approvedAt ? new Date(app.approvedAt) : undefined,
          rejectedAt: app.rejectedAt ? new Date(app.rejectedAt) : undefined,
        })));
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewApplication = async (applicationId: string, action: 'approve' | 'reject') => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'reject' ? rejectionReason : undefined,
          nextSteps: action === 'approve'
            ? 'We will prepare your rental contract and send it to you for digital signature. Please review all terms carefully before signing.'
            : undefined,
        }),
      });

      if (response.ok) {
        // Refresh applications
        await fetchApplications();
        setShowReviewModal(false);
        setSelectedApplication(null);
        setRejectionReason('');

        if (action === 'approve') {
          // Generate contract
          try {
            const contractResponse = await fetch('/api/contracts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                applicationId,
              }),
            });

            if (contractResponse.ok) {
              const contractResult = await contractResponse.json();
              alert(`Application approved successfully! Contract ${contractResult.data.contractData.contractId} has been generated and sent to the tenant.`);
            } else {
              alert('Application approved, but there was an issue generating the contract. Please contact support.');
            }
          } catch (contractError) {
            console.error('Error generating contract:', contractError);
            alert('Application approved, but there was an issue generating the contract. Please contact support.');
          }
        } else {
          alert('Application rejected successfully. The tenant has been notified.');
        }
      } else {
        const error = await response.json();
        alert(error.error || `Failed to ${action} application`);
      }
    } catch (error) {
      console.error(`Error ${action}ing application:`, error);
      alert(`Failed to ${action} application. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const openReviewModal = (application: Application, action: 'approve' | 'reject') => {
    setSelectedApplication(application);
    setReviewAction(action);
    setShowReviewModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <FileText className="h-4 w-4" />;
      case 'under_review': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchTerm === '' ||
      app.property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.property.city.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'submitted' || app.status === 'under_review').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-semibold mb-2">Loading Applications...</h3>
          <p className="text-gray-600">Please wait while we retrieve your applications</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Rental Applications</h1>
          <p className="text-gray-600 mt-2">Review and manage applications for your properties</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search by property, applicant, or city..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {['all', 'submitted', 'under_review', 'approved', 'rejected'].map((status) => (
                  <Button
                    key={status}
                    variant={filter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(status as any)}
                    className="capitalize"
                  >
                    {status.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        <div className="space-y-6">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Found</h3>
                <p className="text-gray-600">
                  {filter === 'all'
                    ? "You haven't received any rental applications yet."
                    : `No applications with status "${filter.replace('_', ' ')}".`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredApplications.map((application) => (
              <Card key={application.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="grid lg:grid-cols-4 gap-6">
                    {/* Property Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                          {application.property.mainImage ? (
                            <img
                              src={application.property.mainImage}
                              alt={application.property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Home className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {application.property.title}
                          </h3>
                          <div className="flex items-center text-gray-600 text-sm mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {application.property.address}, {application.property.city}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center text-green-600">
                              <Euro className="h-4 w-4 mr-1" />
                              €{application.property.monthlyRent}/month
                            </div>
                            <Badge className={getStatusColor(application.status)}>
                              {getStatusIcon(application.status)}
                              <span className="ml-1 capitalize">{application.status.replace('_', ' ')}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Applicant Info */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Applicant</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">{application.applicant.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{application.applicant.email}</span>
                        </div>
                        {application.applicant.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{application.applicant.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Move-in: {application.moveInDate.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Income: €{application.monthlyIncome}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Actions</h4>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => router.push(`/dashboard/landlord/applications/${application.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>

                        {application.status === 'submitted' || application.status === 'under_review' ? (
                          <div className="space-y-2">
                            <Button
                              size="sm"
                              className="w-full bg-green-600 hover:bg-green-700"
                              onClick={() => openReviewModal(application, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => openReviewModal(application, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        ) : application.status === 'approved' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => router.push('/dashboard/landlord/contracts')}
                          >
                            <FileSignature className="h-4 w-4 mr-2" />
                            View Contract
                          </Button>
                        ) : null}

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Application Summary */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Lease Duration:</span>
                        <span className="ml-1 font-medium">{application.leaseDuration} months</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Guarantor:</span>
                        <span className="ml-1 font-medium">{application.hasGuarantor ? 'Yes' : 'No'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Applied:</span>
                        <span className="ml-1 font-medium">{application.createdAt.toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Income Ratio:</span>
                        <span className="ml-1 font-medium">
                          {(Number(application.monthlyIncome) / Number(application.property.monthlyRent)).toFixed(1)}x
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Review Modal */}
        {showReviewModal && selectedApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>
                  {reviewAction === 'approve' ? 'Approve Application' : 'Reject Application'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Property:</strong> {selectedApplication.property.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Applicant:</strong> {selectedApplication.applicant.name}
                  </p>
                </div>

                {reviewAction === 'approve' ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-green-800">Approve Application</h4>
                        <p className="text-sm text-green-700 mt-1">
                          This will approve the application and automatically generate a rental contract.
                          Both you and the tenant will be notified via email.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Rejection *
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Please provide a reason for rejecting this application..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReviewModal(false);
                      setSelectedApplication(null);
                      setRejectionReason('');
                    }}
                    disabled={actionLoading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => selectedApplication && handleReviewApplication(selectedApplication.id, reviewAction)}
                    disabled={actionLoading || (reviewAction === 'reject' && !rejectionReason.trim())}
                    className={`flex-1 ${reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    {actionLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : reviewAction === 'approve' ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    {actionLoading
                      ? 'Processing...'
                      : reviewAction === 'approve'
                        ? 'Approve & Generate Contract'
                        : 'Reject Application'
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
