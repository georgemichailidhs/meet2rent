'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Home,
  Euro,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  FileText,
  CreditCard,
  Shield,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Filter,
  Search,
  RefreshCw,
  Settings,
  UserCheck,
  UserX,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  totalContracts: number;
  totalRevenue: number;
  monthlyGrowth: {
    users: number;
    properties: number;
    revenue: number;
    contracts: number;
  };
  usersByType: {
    tenants: number;
    landlords: number;
    admin: number;
  };
  propertyStats: {
    available: number;
    rented: number;
    pending: number;
  };
  contractStats: {
    active: number;
    pending: number;
    completed: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'user_signup' | 'property_added' | 'contract_signed' | 'payment_received';
    description: string;
    timestamp: Date;
    userId?: string;
    userName?: string;
  }>;
}

interface PendingReview {
  id: string;
  type: 'property' | 'user' | 'review' | 'report';
  title: string;
  description: string;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'reviewing' | 'resolved';
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'users' | 'properties' | 'revenue' | 'contracts'>('users');

  // Check admin access
  useEffect(() => {
    if (session && session.user.userType !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [session, router]);

  useEffect(() => {
    if (session?.user?.userType === 'admin') {
      fetchDashboardData();
    }
  }, [session, timeRange]);

  const fetchDashboardData = async () => {
    try {
      // TODO: Replace with actual API calls
      const mockStats: DashboardStats = {
        totalUsers: 1247,
        totalProperties: 589,
        totalContracts: 342,
        totalRevenue: 127850,
        monthlyGrowth: {
          users: 8.5,
          properties: 12.3,
          revenue: 15.7,
          contracts: 9.2,
        },
        usersByType: {
          tenants: 943,
          landlords: 298,
          admin: 6,
        },
        propertyStats: {
          available: 287,
          rented: 256,
          pending: 46,
        },
        contractStats: {
          active: 256,
          pending: 42,
          completed: 44,
        },
        recentActivity: [
          {
            id: '1',
            type: 'user_signup',
            description: 'New tenant registered: Sofia Michailidou',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            userId: 'tenant3',
            userName: 'Sofia Michailidou',
          },
          {
            id: '2',
            type: 'contract_signed',
            description: 'Contract CNT-2024-002 signed by both parties',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          },
          {
            id: '3',
            type: 'property_added',
            description: 'New property listed: Luxury Villa in Glyfada',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
          },
          {
            id: '4',
            type: 'payment_received',
            description: 'Monthly rent payment received: €1,200',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
          },
        ],
      };

      const mockPendingReviews: PendingReview[] = [
        {
          id: '1',
          type: 'property',
          title: 'Property Verification Required',
          description: 'New property listing needs document verification',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
          priority: 'high',
          status: 'pending',
        },
        {
          id: '2',
          type: 'user',
          title: 'Landlord Verification Pending',
          description: 'Identity documents submitted for review',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
          priority: 'medium',
          status: 'pending',
        },
        {
          id: '3',
          type: 'report',
          title: 'User Report Submitted',
          description: 'Tenant reported issue with landlord communication',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
          priority: 'medium',
          status: 'reviewing',
        },
      ];

      setStats(mockStats);
      setPendingReviews(mockPendingReviews);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (value: number) => {
    return value > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup': return <Users className="h-4 w-4 text-blue-600" />;
      case 'property_added': return <Home className="h-4 w-4 text-green-600" />;
      case 'contract_signed': return <FileText className="h-4 w-4 text-purple-600" />;
      case 'payment_received': return <CreditCard className="h-4 w-4 text-orange-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!session || session.user.userType !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">You don't have permission to access the admin dashboard.</p>
            <Link href="/dashboard">
              <Button>Return to Dashboard</Button>
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
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-semibold mb-2">Loading Admin Dashboard...</h3>
          <p className="text-gray-600">Please wait while we retrieve platform analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Platform overview and management tools</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                {getGrowthIcon(stats?.monthlyGrowth.users || 0)}
                <span className={`ml-1 ${stats?.monthlyGrowth.users && stats.monthlyGrowth.users > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(stats?.monthlyGrowth.users || 0)}
                </span>
                <span className="text-gray-600 ml-1">vs last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Properties</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalProperties.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Home className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                {getGrowthIcon(stats?.monthlyGrowth.properties || 0)}
                <span className={`ml-1 ${stats?.monthlyGrowth.properties && stats.monthlyGrowth.properties > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(stats?.monthlyGrowth.properties || 0)}
                </span>
                <span className="text-gray-600 ml-1">vs last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Contracts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalContracts.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                {getGrowthIcon(stats?.monthlyGrowth.contracts || 0)}
                <span className={`ml-1 ${stats?.monthlyGrowth.contracts && stats.monthlyGrowth.contracts > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(stats?.monthlyGrowth.contracts || 0)}
                </span>
                <span className="text-gray-600 ml-1">vs last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Platform Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalRevenue || 0)}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Euro className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                {getGrowthIcon(stats?.monthlyGrowth.revenue || 0)}
                <span className={`ml-1 ${stats?.monthlyGrowth.revenue && stats.monthlyGrowth.revenue > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(stats?.monthlyGrowth.revenue || 0)}
                </span>
                <span className="text-gray-600 ml-1">vs last period</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Pending Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Pending Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingReviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{review.title}</h4>
                        <p className="text-gray-600 text-xs mt-1">{review.description}</p>
                      </div>
                      <Badge className={`text-xs ${getPriorityColor(review.priority)}`}>
                        {review.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {review.createdAt.toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm">
                          Review
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <Link href="/admin/reviews">
                  <Button variant="outline" className="w-full">
                    View All Reviews
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* User Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tenants</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${((stats?.usersByType.tenants || 0) / (stats?.totalUsers || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-medium">{stats?.usersByType.tenants}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Landlords</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${((stats?.usersByType.landlords || 0) / (stats?.totalUsers || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-medium">{stats?.usersByType.landlords}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Admins</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${((stats?.usersByType.admin || 0) / (stats?.totalUsers || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-medium">{stats?.usersByType.admin}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Status */}
          <Card>
            <CardHeader>
              <CardTitle>Property Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Available</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{stats?.propertyStats.available}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Rented</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{stats?.propertyStats.rented}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium">Pending</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-600">{stats?.propertyStats.pending}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.timestamp.toLocaleString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/users">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold">Manage Users</h3>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/properties">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Home className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold">Manage Properties</h3>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/analytics">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-semibold">Analytics</h3>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/settings">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Settings className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <h3 className="font-semibold">Platform Settings</h3>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
