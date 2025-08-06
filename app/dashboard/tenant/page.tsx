'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Heart, Calendar, User, MapPin, Euro, Home, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function TenantDashboard() {
  const { data: session } = useSession();

  const quickActions = [
    {
      title: 'Search Properties',
      description: 'Find your perfect rental',
      icon: Search,
      href: '/search',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Saved Properties',
      description: 'View your favorite listings',
      icon: Heart,
      href: '/dashboard/tenant/saved',
      color: 'bg-pink-500 hover:bg-pink-600'
    },
    {
      title: 'My Bookings',
      description: 'Scheduled viewings & applications',
      icon: Calendar,
      href: '/booking',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Pay Rent',
      description: 'Make monthly payments securely',
      icon: CreditCard,
      href: '/dashboard/tenant/payments',
      color: 'bg-emerald-500 hover:bg-emerald-600'
    },
    {
      title: 'Profile & Verification',
      description: 'Complete your certification',
      icon: User,
      href: '/dashboard/tenant/profile',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  const recentActivity = [
    { id: 1, action: 'Viewed property', property: 'Modern Apartment in Kolonaki', time: '2 hours ago' },
    { id: 2, action: 'Saved listing', property: 'Studio near Metro Station', time: '1 day ago' },
    { id: 3, action: 'Booked viewing', property: 'Family House in Kifissia', time: '3 days ago' },
  ];

  const recommendedProperties = [
    {
      id: 1,
      title: 'Modern 2BR Apartment',
      location: 'Exarchia, Athens',
      price: '850',
      image: '/api/placeholder/300/200',
      features: ['2 bedrooms', 'Furnished', 'Balcony']
    },
    {
      id: 2,
      title: 'Student Studio',
      location: 'Near University, Athens',
      price: '450',
      image: '/api/placeholder/300/200',
      features: ['Studio', 'Student-friendly', 'WiFi included']
    },
    {
      id: 3,
      title: 'Family House',
      location: 'Kifissia, Athens',
      price: '1200',
      image: '/api/placeholder/300/200',
      features: ['3 bedrooms', 'Garden', 'Pet-friendly']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session?.user?.name || 'Tenant'}!
          </h1>
          <p className="text-gray-600 mt-2">Find your perfect rental with Meet2Rent</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{action.title}</h3>
                    <p className="text-gray-600 text-sm">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recommended Properties */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Recommended for You
                </CardTitle>
                <CardDescription>Properties matching your preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendedProperties.map((property) => (
                    <div key={property.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="bg-gray-200 h-32 rounded-lg mb-3 flex items-center justify-center">
                        <Home className="h-8 w-8 text-gray-400" />
                      </div>
                      <h4 className="font-semibold mb-1">{property.title}</h4>
                      <div className="flex items-center text-gray-600 text-sm mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {property.location}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-green-600 font-semibold">
                          <Euro className="h-4 w-4 mr-1" />
                          {property.price}/month
                        </div>
                        <Button size="sm" variant="outline">View</Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {property.features.map((feature, index) => (
                          <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-4">
                  <Link href="/search">
                    <Button>View All Properties</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Search Widget */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Search</CardTitle>
                <CardDescription>Find properties in your desired area</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Enter location (e.g., Kolonaki, Athens)"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <select className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option>Any Price</option>
                      <option>€300 - €500</option>
                      <option>€500 - €800</option>
                      <option>€800 - €1200</option>
                      <option>€1200+</option>
                    </select>
                  </div>
                  <Button className="px-6">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Profile Complete</span>
                    <span className="text-green-600 font-semibold">75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Complete your verification to unlock more features!
                  </div>
                  <Link href="/dashboard/tenant/profile">
                    <Button size="sm" className="w-full">Complete Profile</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <div className="text-sm font-medium">{activity.action}</div>
                      <div className="text-sm text-gray-600">{activity.property}</div>
                      <div className="text-xs text-gray-400">{activity.time}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Help & Support */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Our AI assistant is available 24/7 to help you with any questions.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Open Chat Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
