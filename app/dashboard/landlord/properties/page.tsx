'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Plus,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Euro,
  BedDouble,
  Bath,
  Users,
  Camera,
  Settings,
  BarChart3,
  Calendar,
  MessageSquare,
  Heart,
  Share2,
  MoreVertical,
  Search,
  Filter,
  SortDesc,
} from 'lucide-react';

interface Property {
  id: string;
  title: string;
  description: string;
  type: string;
  address: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  monthlyRent: number;
  status: 'available' | 'rented' | 'maintenance' | 'draft';
  images: string[];
  mainImage?: string;
  viewCount: number;
  isPublished: boolean;
  createdAt: Date;
  stats?: {
    totalBookings: number;
    activeApplications: number;
    favorites: number;
    messages: number;
  };
}

export default function PropertiesManagementPage() {
  const { data: session } = useSession();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'rent'>('date');

  // Mock data - in real app this would come from API
  useEffect(() => {
    const mockProperties: Property[] = [
      {
        id: '1',
        title: 'Modern 2BR Apartment in Kolonaki',
        description: 'Beautiful apartment with city views...',
        type: 'apartment',
        address: 'Kolonaki Street 123',
        city: 'Athens',
        bedrooms: 2,
        bathrooms: 1,
        area: 75,
        monthlyRent: 1000,
        status: 'available',
        images: ['/api/placeholder/300/200', '/api/placeholder/300/200'],
        mainImage: '/api/placeholder/300/200',
        viewCount: 142,
        isPublished: true,
        createdAt: new Date(),
        stats: {
          totalBookings: 15,
          activeApplications: 3,
          favorites: 28,
          messages: 12,
        },
      },
      {
        id: '2',
        title: 'Cozy Studio near University',
        description: 'Perfect for students...',
        type: 'studio',
        address: 'University Avenue 45',
        city: 'Athens',
        bedrooms: 1,
        bathrooms: 1,
        area: 35,
        monthlyRent: 600,
        status: 'rented',
        images: ['/api/placeholder/300/200'],
        viewCount: 89,
        isPublished: true,
        createdAt: new Date(),
        stats: {
          totalBookings: 8,
          activeApplications: 0,
          favorites: 15,
          messages: 5,
        },
      },
      {
        id: '3',
        title: 'Luxury 3BR House with Garden',
        description: 'Spacious house in quiet neighborhood...',
        type: 'house',
        address: 'Suburban Street 78',
        city: 'Athens',
        bedrooms: 3,
        bathrooms: 2,
        area: 120,
        monthlyRent: 1500,
        status: 'draft',
        images: [],
        viewCount: 0,
        isPublished: false,
        createdAt: new Date(),
        stats: {
          totalBookings: 0,
          activeApplications: 0,
          favorites: 0,
          messages: 0,
        },
      },
    ];

    setProperties(mockProperties);
    setLoading(false);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      available: { variant: 'default' as const, color: 'text-green-600 bg-green-100' },
      rented: { variant: 'secondary' as const, color: 'text-blue-600 bg-blue-100' },
      maintenance: { variant: 'destructive' as const, color: 'text-yellow-600 bg-yellow-100' },
      draft: { variant: 'outline' as const, color: 'text-gray-600 bg-gray-100' },
    };

    const config = variants[status as keyof typeof variants];
    if (!config) return null;

    return (
      <Badge variant={config.variant} className={config.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case 'views':
        return b.viewCount - a.viewCount;
      case 'rent':
        return b.monthlyRent - a.monthlyRent;
      case 'date':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-40 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Properties</h1>
              <p className="text-gray-600 mt-2">Manage your property listings and track performance</p>
            </div>
            <Link href="/dashboard/landlord/properties/create">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Property
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Properties</p>
                  <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
                </div>
                <Home className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-green-600">
                    {properties.filter(p => p.status === 'available').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rented</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {properties.filter(p => p.status === 'rented').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {properties.reduce((sum, p) => sum + p.viewCount, 0)}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="rented">Rented</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <SortDesc className="h-4 w-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Latest</option>
                  <option value="views">Most Viewed</option>
                  <option value="rent">Highest Rent</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Properties Grid */}
        {sortedProperties.length === 0 ? (
          <Card className="p-12 text-center">
            <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No properties found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? "Try adjusting your search or filters."
                : "You haven't created any properties yet."
              }
            </p>
            <Link href="/dashboard/landlord/properties/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Property
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedProperties.map((property) => (
              <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  {/* Property Image */}
                  <div className="aspect-video bg-gray-200 flex items-center justify-center relative">
                    {property.mainImage ? (
                      <img
                        src={property.mainImage}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">No photos</p>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      {getStatusBadge(property.status)}
                    </div>

                    {/* Quick Actions */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Property Info */}
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-1">
                        {property.title}
                      </h3>
                      <div className="flex items-center text-gray-600 text-sm">
                        <MapPin className="h-4 w-4 mr-1" />
                        {property.city}
                      </div>
                    </div>

                    {/* Property Details */}
                    <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                      <div className="text-center">
                        <BedDouble className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                        <span className="text-gray-600">{property.bedrooms} bed</span>
                      </div>
                      <div className="text-center">
                        <Bath className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                        <span className="text-gray-600">{property.bathrooms} bath</span>
                      </div>
                      <div className="text-center">
                        <Home className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                        <span className="text-gray-600">{property.area}m²</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-green-600 font-semibold text-lg">
                        <Euro className="h-4 w-4 mr-1" />
                        {property.monthlyRent}/month
                      </div>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Eye className="h-4 w-4 mr-1" />
                        {property.viewCount} views
                      </div>
                    </div>

                    {/* Stats */}
                    {property.stats && (
                      <div className="grid grid-cols-4 gap-2 mb-4 text-xs">
                        <div className="text-center">
                          <div className="font-semibold text-blue-600">{property.stats.totalBookings}</div>
                          <div className="text-gray-500">Bookings</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-green-600">{property.stats.activeApplications}</div>
                          <div className="text-gray-500">Active</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-pink-600">{property.stats.favorites}</div>
                          <div className="text-gray-500">Favorites</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-purple-600">{property.stats.messages}</div>
                          <div className="text-gray-500">Messages</div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/property/${property.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/dashboard/landlord/properties/${property.id}/edit`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/dashboard/landlord/properties/${property.id}/analytics`}>
                        <Button variant="outline" size="sm" className="px-3">
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
