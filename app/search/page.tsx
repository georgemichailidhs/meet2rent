'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  MapPin,
  Euro,
  BedDouble,
  Bath,
  Home,
  Star,
  Heart,
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  ChevronDown,
  Users,
  Wifi,
  Car,
  PawPrint,
  Cigarette,
  Mountain,
} from 'lucide-react';
import Link from 'next/link';
import { PropertySearchFilters, PropertyListItem } from '@/lib/types/database';

interface SearchResults {
  properties: PropertyListItem[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [savedProperties, setSavedProperties] = useState<Set<string>>(new Set());

  // Search filters state
  const [filters, setFilters] = useState<PropertySearchFilters>({
    query: searchParams.get('query') || '',
    city: searchParams.get('city') || '',
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    bedrooms: searchParams.get('bedrooms') ? Number(searchParams.get('bedrooms')) : undefined,
    bathrooms: searchParams.get('bathrooms') ? Number(searchParams.get('bathrooms')) : undefined,
    propertyType: searchParams.get('propertyType') || undefined,
    furnished: searchParams.get('furnished') || undefined,
    petsAllowed: searchParams.get('petsAllowed') ? searchParams.get('petsAllowed') === 'true' : undefined,
    sortBy: (searchParams.get('sortBy') as any) || 'date_desc',
    page: Number(searchParams.get('page')) || 1,
    limit: 20,
  });

  // Available options for filters
  const propertyTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'studio', label: 'Studio' },
    { value: 'loft', label: 'Loft' },
  ];

  const furnishedOptions = [
    { value: 'furnished', label: 'Furnished' },
    { value: 'semi_furnished', label: 'Semi-Furnished' },
    { value: 'unfurnished', label: 'Unfurnished' },
  ];

  const sortOptions = [
    { value: 'date_desc', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'relevance', label: 'Most Relevant' },
  ];

  // Popular Greek cities
  const popularCities = [
    'Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa',
    'Volos', 'Ioannina', 'Kavala', 'Chania', 'Rhodes'
  ];

  // Search function
  const searchProperties = useCallback(async (searchFilters: PropertySearchFilters) => {
    setLoading(true);
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();

      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          if (Array.isArray(value)) {
            queryParams.set(key, value.join(','));
          } else {
            queryParams.set(key, value.toString());
          }
        }
      });

      // For now, use mock data - in real app this would be API call
      const mockProperties: PropertyListItem[] = [
        {
          id: '1',
          title: 'Modern 2BR Apartment in Kolonaki',
          description: 'Beautiful apartment with city views and modern amenities...',
          type: 'apartment',
          address: 'Kolonaki Street 123',
          city: 'Athens',
          region: 'Attica',
          bedrooms: 2,
          bathrooms: 1,
          area: '75',
          monthlyRent: '1000',
          securityDeposit: '1000',
          furnished: 'furnished',
          petsAllowed: false,
          smokingAllowed: false,
          minimumStayMonths: 6,
          maximumOccupants: 3,
          amenities: ['wifi', 'ac', 'balcony', 'elevator'],
          features: ['modern', 'city_view', 'central_location'],
          images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
          mainImage: '/api/placeholder/400/300',
          slug: 'modern-2br-apartment-kolonaki',
          status: 'available',
          isPublished: true,
          viewCount: 142,
          availableFrom: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          landlordId: 'landlord1',
          landlord: {
            id: 'landlord1',
            name: 'Maria Konstantinou',
            image: '/api/placeholder/100/100',
          },
        },
        {
          id: '2',
          title: 'Student Studio near University',
          description: 'Perfect studio for students with all essential amenities...',
          type: 'studio',
          address: 'University Avenue 45',
          city: 'Athens',
          region: 'Attica',
          bedrooms: 1,
          bathrooms: 1,
          area: '35',
          monthlyRent: '600',
          securityDeposit: '600',
          furnished: 'furnished',
          petsAllowed: false,
          smokingAllowed: false,
          minimumStayMonths: 3,
          maximumOccupants: 1,
          amenities: ['wifi', 'kitchenette'],
          features: ['student_friendly', 'metro_nearby'],
          images: ['/api/placeholder/400/300'],
          mainImage: '/api/placeholder/400/300',
          slug: 'student-studio-university',
          status: 'available',
          isPublished: true,
          viewCount: 89,
          availableFrom: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          landlordId: 'landlord2',
          landlord: {
            id: 'landlord2',
            name: 'Dimitris Papadopoulos',
            image: '/api/placeholder/100/100',
          },
        },
      ];

      // Simple filtering for demonstration
      let filteredProperties = mockProperties;

      if (searchFilters.query) {
        filteredProperties = filteredProperties.filter(p =>
          p.title.toLowerCase().includes(searchFilters.query!.toLowerCase()) ||
          p.description.toLowerCase().includes(searchFilters.query!.toLowerCase())
        );
      }

      if (searchFilters.city) {
        filteredProperties = filteredProperties.filter(p =>
          p.city.toLowerCase().includes(searchFilters.city!.toLowerCase())
        );
      }

      if (searchFilters.minPrice) {
        filteredProperties = filteredProperties.filter(p =>
          Number(p.monthlyRent) >= searchFilters.minPrice!
        );
      }

      if (searchFilters.maxPrice) {
        filteredProperties = filteredProperties.filter(p =>
          Number(p.monthlyRent) <= searchFilters.maxPrice!
        );
      }

      if (searchFilters.bedrooms) {
        filteredProperties = filteredProperties.filter(p =>
          p.bedrooms >= searchFilters.bedrooms!
        );
      }

      if (searchFilters.propertyType) {
        filteredProperties = filteredProperties.filter(p =>
          p.type === searchFilters.propertyType
        );
      }

      // Sort results
      switch (searchFilters.sortBy) {
        case 'price_asc':
          filteredProperties.sort((a, b) => Number(a.monthlyRent) - Number(b.monthlyRent));
          break;
        case 'price_desc':
          filteredProperties.sort((a, b) => Number(b.monthlyRent) - Number(a.monthlyRent));
          break;
        case 'date_desc':
        default:
          filteredProperties.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
      }

      setProperties(filteredProperties);
      setTotal(filteredProperties.length);
      setTotalPages(Math.ceil(filteredProperties.length / 20));

      // Update URL
      const newUrl = `/search?${queryParams.toString()}`;
      router.push(newUrl, { scroll: false });

    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Effect to search when filters change
  useEffect(() => {
    searchProperties(filters);
  }, [searchProperties, filters]);

  // Update filter function
  const updateFilter = (key: keyof PropertySearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      query: '',
      page: 1,
      limit: 20,
      sortBy: 'date_desc',
    });
  };

  // Toggle property favorite
  const toggleFavorite = (propertyId: string) => {
    setSavedProperties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header with Search */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Find Your Perfect Home</h1>

          {/* Main Search Bar */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by title, location, or keywords..."
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-lg"
                    value={filters.query || ''}
                    onChange={(e) => updateFilter('query', e.target.value)}
                  />
                </div>

                {/* Location Filter */}
                <div className="lg:w-64">
                  <select
                    value={filters.city || ''}
                    onChange={(e) => updateFilter('city', e.target.value)}
                    className="w-full py-3 px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 text-lg"
                  >
                    <option value="">All Cities</option>
                    {popularCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Quick Filters */}
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:px-6 py-3"
                >
                  <SlidersHorizontal className="h-5 w-5 mr-2" />
                  Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Popular Cities Quick Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            {popularCities.slice(0, 6).map(city => (
              <Button
                key={city}
                variant={filters.city === city ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter('city', filters.city === city ? '' : city)}
              >
                {city}
              </Button>
            ))}
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Advanced Filters</CardTitle>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">Min Price (€)</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full p-2 border rounded-lg"
                    value={filters.minPrice || ''}
                    onChange={(e) => updateFilter('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Price (€)</label>
                  <input
                    type="number"
                    placeholder="5000"
                    className="w-full p-2 border rounded-lg"
                    value={filters.maxPrice || ''}
                    onChange={(e) => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="block text-sm font-medium mb-2">Bedrooms</label>
                  <select
                    value={filters.bedrooms || ''}
                    onChange={(e) => updateFilter('bedrooms', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </div>

                {/* Bathrooms */}
                <div>
                  <label className="block text-sm font-medium mb-2">Bathrooms</label>
                  <select
                    value={filters.bathrooms || ''}
                    onChange={(e) => updateFilter('bathrooms', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                  </select>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">Property Type</label>
                  <select
                    value={filters.propertyType || ''}
                    onChange={(e) => updateFilter('propertyType', e.target.value || undefined)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">All Types</option>
                    {propertyTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Furnished */}
                <div>
                  <label className="block text-sm font-medium mb-2">Furnished</label>
                  <select
                    value={filters.furnished || ''}
                    onChange={(e) => updateFilter('furnished', e.target.value || undefined)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Any</option>
                    {furnishedOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Pets Allowed */}
                <div>
                  <label className="block text-sm font-medium mb-2">Pets</label>
                  <select
                    value={filters.petsAllowed === undefined ? '' : filters.petsAllowed.toString()}
                    onChange={(e) => updateFilter('petsAllowed', e.target.value === '' ? undefined : e.target.value === 'true')}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Any</option>
                    <option value="true">Pets Allowed</option>
                    <option value="false">No Pets</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium mb-2">Sort By</label>
                  <select
                    value={filters.sortBy || 'date_desc'}
                    onChange={(e) => updateFilter('sortBy', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {loading ? 'Searching...' : `${total} Properties Found`}
            </h2>
            {filters.city && (
              <p className="text-gray-600">in {filters.city}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="px-3"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-3"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="overflow-hidden">
                <div className="animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && (
          <>
            {properties.length === 0 ? (
              <Card className="p-12 text-center">
                <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No properties found</h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your search filters or check back later for new listings.
                </p>
                <Button onClick={clearFilters}>
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <>
                {/* Property Grid */}
                <div className={`grid gap-6 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1'
                }`}>
                  {properties.map((property) => (
                    <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                      <div className={`${viewMode === 'list' ? 'flex' : ''}`}>
                        {/* Property Image */}
                        <div className={`relative bg-gray-200 ${
                          viewMode === 'list' ? 'w-80 h-60' : 'aspect-video'
                        }`}>
                          {property.mainImage ? (
                            <img
                              src={property.mainImage}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Home className="h-12 w-12 text-gray-400" />
                            </div>
                          )}

                          {/* Favorite Button */}
                          <button
                            onClick={() => toggleFavorite(property.id)}
                            className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                          >
                            <Heart
                              className={`h-5 w-5 ${
                                savedProperties.has(property.id)
                                  ? 'fill-red-500 text-red-500'
                                  : 'text-gray-600'
                              }`}
                            />
                          </button>

                          {/* Property Type Badge */}
                          <div className="absolute bottom-3 left-3">
                            <Badge className="bg-white/90 text-gray-900">
                              {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
                            </Badge>
                          </div>
                        </div>

                        {/* Property Info */}
                        <CardContent className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                          <div className="mb-3">
                            <Link href={`/property/${property.id}`}>
                              <h3 className="font-semibold text-lg text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                                {property.title}
                              </h3>
                            </Link>
                            <div className="flex items-center text-gray-600 text-sm mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              {property.city}
                            </div>
                          </div>

                          {/* Property Details */}
                          <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                            <div className="flex items-center">
                              <BedDouble className="h-4 w-4 text-gray-400 mr-1" />
                              <span>{property.bedrooms} bed</span>
                            </div>
                            <div className="flex items-center">
                              <Bath className="h-4 w-4 text-gray-400 mr-1" />
                              <span>{property.bathrooms} bath</span>
                            </div>
                            <div className="flex items-center">
                              <Home className="h-4 w-4 text-gray-400 mr-1" />
                              <span>{property.area}m²</span>
                            </div>
                          </div>

                          {/* Amenities */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {property.amenities.slice(0, 3).map((amenity, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {amenity}
                              </Badge>
                            ))}
                            {property.amenities.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{property.amenities.length - 3}
                              </Badge>
                            )}
                          </div>

                          {/* Price and Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-green-600 font-bold text-xl">
                              <Euro className="h-5 w-5 mr-1" />
                              {property.monthlyRent}/month
                            </div>
                            <Link href={`/property/${property.id}`}>
                              <Button size="sm">
                                View Details
                              </Button>
                            </Link>
                          </div>

                          {/* Landlord Info */}
                          <div className="flex items-center mt-3 pt-3 border-t">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                              {property.landlord.image ? (
                                <img
                                  src={property.landlord.image}
                                  alt={property.landlord.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <Users className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {property.landlord.name}
                              </p>
                              <p className="text-xs text-gray-600">Landlord</p>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        disabled={page <= 1}
                        onClick={() => updateFilter('page', page - 1)}
                      >
                        Previous
                      </Button>

                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            onClick={() => updateFilter('page', pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}

                      <Button
                        variant="outline"
                        disabled={page >= totalPages}
                        onClick={() => updateFilter('page', page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
