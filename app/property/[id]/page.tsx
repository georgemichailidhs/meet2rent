'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  MapPin,
  Euro,
  BedDouble,
  Bath,
  Home,
  Users,
  Calendar,
  Heart,
  Share2,
  Star,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Phone,
  Mail,
  Shield,
  CheckCircle,
  Wifi,
  Car,
  PawPrint,
  Cigarette,
  Mountain,
  Maximize,
  Camera,
  Eye,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { PropertyWithDetails } from '@/lib/types/database';
import BookingModal from '@/components/BookingModal';

// Mock data - in real app this would come from API
const mockProperty: PropertyWithDetails = {
  id: '1',
  landlordId: 'landlord1',
  title: 'Modern 2BR Apartment with Stunning City Views',
  description: `Experience luxury living in this beautifully renovated 2-bedroom apartment located in the heart of Kolonaki. This stunning property features high ceilings, hardwood floors, and floor-to-ceiling windows that flood the space with natural light.

The open-plan living area seamlessly connects the modern kitchen with premium appliances to the comfortable living room, perfect for entertaining. Both bedrooms are generously sized with built-in wardrobes, and the master bedroom includes an en-suite bathroom.

Located on the 4th floor of a well-maintained building with elevator access, you'll enjoy breathtaking views of the Acropolis and the vibrant city below. The apartment comes fully furnished with designer furniture and high-end appliances.

The neighborhood offers excellent dining, shopping, and cultural attractions within walking distance. Public transportation is easily accessible, making it convenient to explore all that Athens has to offer.`,
  type: 'apartment',
  address: 'Kolonaki Street 123',
  city: 'Athens',
  region: 'Attica',
  postalCode: '10676',
  country: 'Greece',
  latitude: '37.9779',
  longitude: '23.7348',
  bedrooms: 2,
  bathrooms: 2,
  area: '75',
  floor: 4,
  totalFloors: 6,
  yearBuilt: 2018,
  furnished: 'furnished',
  monthlyRent: '1200',
  securityDeposit: '1200',
  utilityDeposit: '200',
  currency: 'EUR',
  petsAllowed: false,
  smokingAllowed: false,
  minimumStayMonths: 6,
  maximumOccupants: 3,
  amenities: JSON.stringify(['wifi', 'ac', 'heating', 'balcony', 'elevator', 'security', 'city_view']),
  features: JSON.stringify(['modern', 'renovated', 'high_ceilings', 'hardwood_floors']),
  nearbyFacilities: JSON.stringify(['metro', 'restaurants', 'shopping', 'parks', 'hospital']),
  images: JSON.stringify([
    '/api/placeholder/800/600',
    '/api/placeholder/800/600',
    '/api/placeholder/800/600',
    '/api/placeholder/800/600',
    '/api/placeholder/800/600',
    '/api/placeholder/800/600',
  ]),
  mainImage: '/api/placeholder/800/600',
  virtualTourUrl: 'https://example.com/tour',
  slug: 'modern-2br-apartment-kolonaki',
  status: 'available',
  isPublished: true,
  publishedAt: new Date(),
  viewCount: 248,
  availableFrom: new Date('2024-04-01'),
  createdAt: new Date(),
  updatedAt: new Date(),
  landlord: {
    id: 'landlord1',
    name: 'Maria Konstantinou',
    email: 'maria@example.com',
    image: '/api/placeholder/150/150',
    userType: 'landlord',
    phone: '+30 210 555 0201',
    emailVerified: new Date(),
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  isFavorite: false,
  reviewStats: {
    averageRating: 4.8,
    totalReviews: 23,
  },
};

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-4 w-4" />,
  ac: '❄️',
  heating: '🔥',
  parking: <Car className="h-4 w-4" />,
  balcony: '🌅',
  elevator: '🛗',
  security: <Shield className="h-4 w-4" />,
  city_view: '🏙️',
  sea_view: '🌊',
  mountain_view: <Mountain className="h-4 w-4" />,
};

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<PropertyWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullGallery, setShowFullGallery] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingType, setBookingType] = useState<'viewing' | 'application'>('viewing');

  useEffect(() => {
    // TODO: Fetch property data from API
    setProperty(mockProperty);
    setIsFavorite(mockProperty.isFavorite || false);
    setLoading(false);

    // Track property view
    // TODO: Implement view tracking
  }, [propertyId]);

  const images = property?.images ? JSON.parse(property.images as string) : [];
  const amenities = property?.amenities ? JSON.parse(property.amenities as string) : [];
  const features = property?.features ? JSON.parse(property.features as string) : [];
  const nearbyFacilities = property?.nearbyFacilities ? JSON.parse(property.nearbyFacilities as string) : [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const toggleFavorite = async () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    try {
      // TODO: API call to toggle favorite
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleBooking = (type: 'viewing' | 'application') => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    setBookingType(type);
    setShowBookingModal(true);
  };

  const shareProperty = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.title,
          text: `Check out this amazing property: ${property?.title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200"></div>
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 mb-4">Property Not Found</h1>
            <p className="text-gray-600 mb-6">The property you're looking for could not be found.</p>
            <Link href="/search">
              <Button>Browse Properties</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Image Gallery */}
      <div className="relative">
        {/* Main Image */}
        <div className="h-96 lg:h-[500px] relative overflow-hidden">
          {images.length > 0 ? (
            <img
              src={images[currentImageIndex]}
              alt={`Property ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <Camera className="h-16 w-16 text-gray-400" />
            </div>
          )}

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}

          {/* Gallery Button */}
          {images.length > 1 && (
            <button
              onClick={() => setShowFullGallery(true)}
              className="absolute bottom-4 right-4 bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              View All {images.length} Photos
            </button>
          )}

          {/* Actions Overlay */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={shareProperty}
              className="bg-white/90 text-gray-900 p-2 rounded-full hover:bg-white transition-colors"
            >
              <Share2 className="h-5 w-5" />
            </button>
            <button
              onClick={toggleFavorite}
              className="bg-white/90 text-gray-900 p-2 rounded-full hover:bg-white transition-colors"
            >
              <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>

          {/* Back Button */}
          <Link
            href="/search"
            className="absolute top-4 left-4 bg-white/90 text-gray-900 p-2 rounded-full hover:bg-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="bg-white border-b px-6 py-4">
            <div className="flex gap-2 overflow-x-auto">
              {images.slice(0, 8).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    currentImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              {images.length > 8 && (
                <button
                  onClick={() => setShowFullGallery(true)}
                  className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 border-2 border-gray-200 hover:border-gray-300"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{property.address}, {property.city}, {property.region}</span>
                  </div>
                </div>
                <Badge variant={property.status === 'available' ? 'default' : 'secondary'}>
                  {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                </Badge>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-white rounded-lg border">
                <div className="text-center">
                  <BedDouble className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">{property.bedrooms}</div>
                  <div className="text-sm text-gray-600">Bedrooms</div>
                </div>
                <div className="text-center">
                  <Bath className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">{property.bathrooms}</div>
                  <div className="text-sm text-gray-600">Bathrooms</div>
                </div>
                <div className="text-center">
                  <Home className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">{property.area}m²</div>
                  <div className="text-sm text-gray-600">Area</div>
                </div>
                <div className="text-center">
                  <Users className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">{property.maximumOccupants}</div>
                  <div className="text-sm text-gray-600">Max Guests</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Property</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </CardContent>
            </Card>

            {/* Amenities */}
            {amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Amenities & Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {amenities.map((amenity: string) => (
                      <div key={amenity} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-blue-600">
                          {amenityIcons[amenity] || <CheckCircle className="h-4 w-4" />}
                        </div>
                        <span className="capitalize text-gray-700">
                          {amenity.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property Type</span>
                      <span className="font-medium capitalize">{property.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Furnished</span>
                      <span className="font-medium capitalize">{property.furnished.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Floor</span>
                      <span className="font-medium">
                        {property.floor ? `${property.floor}${property.totalFloors ? ` of ${property.totalFloors}` : ''}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year Built</span>
                      <span className="font-medium">{property.yearBuilt || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available From</span>
                      <span className="font-medium">
                        {property.availableFrom?.toLocaleDateString() || 'Immediately'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Minimum Stay</span>
                      <span className="font-medium">{property.minimumStayMonths} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pets Allowed</span>
                      <span className="font-medium">
                        {property.petsAllowed ? (
                          <span className="text-green-600 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" /> Yes
                          </span>
                        ) : (
                          <span className="text-red-600">No</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Smoking Allowed</span>
                      <span className="font-medium">
                        {property.smokingAllowed ? (
                          <span className="text-green-600 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" /> Yes
                          </span>
                        ) : (
                          <span className="text-red-600">No</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property Views</span>
                      <span className="font-medium flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {property.viewCount}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Virtual Tour */}
            {property.virtualTourUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Virtual Tour</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <a href={property.virtualTourUrl} target="_blank" rel="noopener noreferrer">
                      <Camera className="h-4 w-4 mr-2" />
                      Take Virtual Tour
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {property.reviewStats && property.reviewStats.totalReviews > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    Reviews
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold">{property.reviewStats.averageRating}</span>
                      <span className="text-gray-600">({property.reviewStats.totalReviews} reviews)</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    View All Reviews
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <Card className="sticky top-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-green-600 font-bold text-2xl">
                    <Euro className="h-6 w-6 mr-1" />
                    {property.monthlyRent}/month
                  </div>
                  {property.status === 'available' && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Available
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Additional Costs */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Security Deposit</span>
                    <span className="font-medium">€{property.securityDeposit}</span>
                  </div>
                  {property.utilityDeposit && Number(property.utilityDeposit) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Utility Deposit</span>
                      <span className="font-medium">€{property.utilityDeposit}</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleBooking('viewing')}
                      className="w-full"
                      disabled={property.status !== 'available'}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Viewing
                    </Button>

                    <Button
                      onClick={() => handleBooking('application')}
                      variant="outline"
                      className="w-full"
                      disabled={property.status !== 'available'}
                    >
                      Apply to Rent
                    </Button>
                  </div>
                </div>

                {property.status !== 'available' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
                    <p className="text-sm text-yellow-800">
                      This property is currently not available for rent
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Landlord Info */}
            <Card>
              <CardHeader>
                <CardTitle>Property Owner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {property.landlord.image ? (
                      <img
                        src={property.landlord.image}
                        alt={property.landlord.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{property.landlord.name}</h3>
                      {property.landlord.isVerified && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Property Owner</p>

                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                      {property.landlord.phone && (
                        <Button variant="outline" size="sm" className="w-full">
                          <Phone className="h-4 w-4 mr-2" />
                          Call Owner
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Safety Information */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Safe & Secure</h4>
                    <p className="text-sm text-blue-700">
                      All payments are protected and landlords are verified.
                      Never send money directly to avoid scams.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Info */}
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{property.city}, {property.region}</span>
                  </div>

                  {/* TODO: Add map integration */}
                  <div className="h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">Map will be displayed here</span>
                  </div>

                  {nearbyFacilities.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Nearby</h4>
                      <div className="flex flex-wrap gap-1">
                        {nearbyFacilities.map((facility: string) => (
                          <Badge key={facility} variant="secondary" className="text-xs">
                            {facility.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        property={property}
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        type={bookingType}
      />

      {/* Full Gallery Modal would go here - TODO: Implement gallery modal */}
      {showFullGallery && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <button
            onClick={() => setShowFullGallery(false)}
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="w-full h-full flex items-center justify-center p-4">
            <img
              src={images[currentImageIndex]}
              alt={`Property ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white p-2 hover:bg-white/20 rounded-full"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white p-2 hover:bg-white/20 rounded-full"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
