'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  MessageSquare,
  User,
  Home,
  Calendar,
  MapPin,
  Euro,
  ThumbsUp,
  ThumbsDown,
  Filter,
  Search,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerType: 'tenant' | 'landlord';
  revieweeId: string;
  revieweeName: string;
  revieweeType: 'tenant' | 'landlord';
  propertyId?: number;
  propertyTitle?: string;
  propertyLocation?: string;
  rating: number;
  title: string;
  content: string;
  categories: {
    communication: number;
    cleanliness: number;
    reliability: number;
    responsiveness: number;
    overall: number;
  };
  pros: string[];
  cons: string[];
  wouldRecommend: boolean;
  verifiedRental: boolean;
  helpful: number;
  reported: number;
  createdAt: Date;
  response?: {
    content: string;
    createdAt: Date;
  };
}

interface PendingReview {
  id: string;
  propertyId: number;
  propertyTitle: string;
  propertyLocation: string;
  otherPartyId: string;
  otherPartyName: string;
  otherPartyType: 'tenant' | 'landlord';
  leaseStartDate: Date;
  leaseEndDate: Date;
  reviewType: 'tenant_to_landlord' | 'landlord_to_tenant';
  daysRemaining: number;
}

const mockReviews: Review[] = [
  {
    id: 'rev1',
    reviewerId: 'tenant1',
    reviewerName: 'Anna Papadopoulos',
    reviewerType: 'tenant',
    revieweeId: 'landlord1',
    revieweeName: 'Maria Konstantinou',
    revieweeType: 'landlord',
    propertyId: 1,
    propertyTitle: 'Modern 2BR Apartment',
    propertyLocation: 'Kolonaki, Athens',
    rating: 5,
    title: 'Excellent landlord and amazing apartment!',
    content: 'Maria was incredibly responsive and helpful throughout my entire tenancy. The apartment was exactly as advertised, clean, and well-maintained. She was always available for any questions or concerns and fixed issues promptly. The location in Kolonaki is perfect with great access to transportation and amenities. I would definitely rent from Maria again and highly recommend her to other tenants.',
    categories: {
      communication: 5,
      cleanliness: 5,
      reliability: 5,
      responsiveness: 5,
      overall: 5
    },
    pros: [
      'Very responsive to messages and calls',
      'Property exactly as described',
      'Quick to resolve any maintenance issues',
      'Professional and respectful',
      'Great location and amenities'
    ],
    cons: [
      'None - everything was perfect!'
    ],
    wouldRecommend: true,
    verifiedRental: true,
    helpful: 12,
    reported: 0,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    response: {
      content: 'Thank you so much Anna! It was a pleasure having you as a tenant. You took excellent care of the apartment and were always communicative. Best of luck with your new home!',
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    }
  },
  {
    id: 'rev2',
    reviewerId: 'landlord2',
    reviewerName: 'John Smith',
    reviewerType: 'landlord',
    revieweeId: 'tenant2',
    revieweeName: 'Dimitris Kostas',
    revieweeType: 'tenant',
    propertyId: 2,
    propertyTitle: 'Student Studio Near University',
    propertyLocation: 'Exarchia, Athens',
    rating: 4,
    title: 'Reliable tenant, would recommend',
    content: 'Dimitris was a responsible tenant who took good care of my studio apartment. He always paid rent on time and was respectful of the property and neighbors. Communication was generally good, though sometimes took a while to respond to messages. He left the apartment in good condition at the end of his lease. Would definitely consider renting to him again.',
    categories: {
      communication: 3,
      cleanliness: 4,
      reliability: 5,
      responsiveness: 3,
      overall: 4
    },
    pros: [
      'Always paid rent on time',
      'Respectful of property and neighbors',
      'Left apartment clean and undamaged',
      'Followed all lease terms'
    ],
    cons: [
      'Sometimes slow to respond to messages',
      'Could have been more proactive about minor maintenance issues'
    ],
    wouldRecommend: true,
    verifiedRental: true,
    helpful: 8,
    reported: 0,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 14 days ago
  },
  {
    id: 'rev3',
    reviewerId: 'tenant3',
    reviewerName: 'Elena Dimitriou',
    reviewerType: 'tenant',
    revieweeId: 'landlord3',
    revieweeName: 'Kostas Georgiadis',
    revieweeType: 'landlord',
    propertyId: 3,
    propertyTitle: 'Family House with Garden',
    propertyLocation: 'Kifissia, Athens',
    rating: 2,
    title: 'Multiple issues, not recommended',
    content: 'Unfortunately, my experience with this landlord was quite disappointing. The property had several undisclosed issues including plumbing problems and heating that didn\'t work properly. When I reported these issues, it took weeks to get any response, and some problems were never fully resolved. The landlord was often unresponsive and seemed unwilling to address legitimate maintenance concerns. Would not recommend.',
    categories: {
      communication: 2,
      cleanliness: 3,
      reliability: 1,
      responsiveness: 1,
      overall: 2
    },
    pros: [
      'Nice location',
      'Good garden space'
    ],
    cons: [
      'Unresponsive to maintenance requests',
      'Multiple undisclosed property issues',
      'Poor communication',
      'Heating and plumbing problems',
      'Took security deposit deductions unfairly'
    ],
    wouldRecommend: false,
    verifiedRental: true,
    helpful: 15,
    reported: 1,
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000) // 21 days ago
  }
];

const mockPendingReviews: PendingReview[] = [
  {
    id: 'pending1',
    propertyId: 4,
    propertyTitle: 'Digital Nomad Friendly Loft',
    propertyLocation: 'Psyrri, Athens',
    otherPartyId: 'landlord4',
    otherPartyName: 'Sofia Michalopoulos',
    otherPartyType: 'landlord',
    leaseStartDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    leaseEndDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    reviewType: 'tenant_to_landlord',
    daysRemaining: 15 // 30 days to submit review
  },
  {
    id: 'pending2',
    propertyId: 5,
    propertyTitle: 'Cozy 1BR Near Metro',
    propertyLocation: 'Pangrati, Athens',
    otherPartyId: 'tenant4',
    otherPartyName: 'Nikos Papadakis',
    otherPartyType: 'tenant',
    leaseStartDate: new Date(Date.now() - 545 * 24 * 60 * 60 * 1000),
    leaseEndDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    reviewType: 'landlord_to_tenant',
    daysRemaining: 20
  }
];

export default function ReviewsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'received' | 'given' | 'pending'>('received');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedPendingReview, setSelectedPendingReview] = useState<PendingReview | null>(null);
  const [filterRating, setFilterRating] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock user type - in real app this would come from session
  const userType = 'tenant'; // or 'landlord'

  const filteredReviews = mockReviews.filter(review => {
    const matchesSearch = searchQuery === '' ||
      review.reviewerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.revieweeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.propertyTitle?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating = filterRating === 'all' ||
      (filterRating === '5' && review.rating === 5) ||
      (filterRating === '4+' && review.rating >= 4) ||
      (filterRating === '3+' && review.rating >= 3) ||
      (filterRating === 'low' && review.rating <= 2);

    const matchesTab = activeTab === 'received'
      ? review.revieweeType === userType
      : review.reviewerType === userType;

    return matchesSearch && matchesRating && matchesTab;
  });

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    };

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const ReviewCard = ({ review }: { review: Review }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold">{review.reviewerName}</h3>
                <Badge variant="secondary" className="text-xs">
                  {review.reviewerType}
                </Badge>
                {review.verifiedRental && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
              <div className="flex items-center space-x-2 mb-2">
                {renderStars(review.rating)}
                <span className="text-sm text-gray-600">
                  {new Date(review.createdAt).toLocaleDateString('en-GB')}
                </span>
              </div>
              {review.propertyTitle && (
                <div className="flex items-center text-sm text-gray-600">
                  <Home className="h-3 w-3 mr-1" />
                  <span>{review.propertyTitle}</span>
                  <span className="mx-2">•</span>
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{review.propertyLocation}</span>
                </div>
              )}
            </div>
          </div>
          <Badge variant={review.wouldRecommend ? 'default' : 'secondary'}>
            {review.wouldRecommend ? 'Recommends' : 'Not Recommended'}
          </Badge>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-lg mb-2">{review.title}</h4>
          <p className="text-gray-700 leading-relaxed">{review.content}</p>
        </div>

        {/* Category Ratings */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          {Object.entries(review.categories).map(([category, rating]) => (
            <div key={category} className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </div>
              <div className="flex justify-center">
                {renderStars(rating, 'sm')}
              </div>
            </div>
          ))}
        </div>

        {/* Pros and Cons */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <h5 className="font-medium text-green-700 mb-2 flex items-center">
              <ThumbsUp className="h-4 w-4 mr-1" />
              Pros
            </h5>
            <ul className="text-sm space-y-1">
              {review.pros.map((pro, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-red-700 mb-2 flex items-center">
              <ThumbsDown className="h-4 w-4 mr-1" />
              Cons
            </h5>
            <ul className="text-sm space-y-1">
              {review.cons.map((con, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Response */}
        {review.response && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center space-x-2 mb-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Response from {review.revieweeName}</span>
              <span className="text-xs text-blue-600">
                {new Date(review.response.createdAt).toLocaleDateString('en-GB')}
              </span>
            </div>
            <p className="text-sm text-blue-800">{review.response.content}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <button className="flex items-center space-x-1 hover:text-blue-600">
              <ThumbsUp className="h-4 w-4" />
              <span>Helpful ({review.helpful})</span>
            </button>
            {review.reported > 0 && (
              <span className="flex items-center space-x-1 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Reported ({review.reported})</span>
              </span>
            )}
          </div>

          {activeTab === 'received' && !review.response && review.revieweeType === userType && (
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Respond
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const PendingReviewCard = ({ pendingReview }: { pendingReview: PendingReview }) => (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">
                Review {pendingReview.otherPartyName}
              </h3>
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Home className="h-3 w-3 mr-1" />
                <span>{pendingReview.propertyTitle}</span>
                <span className="mx-2">•</span>
                <MapPin className="h-3 w-3 mr-1" />
                <span>{pendingReview.propertyLocation}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-3 w-3 mr-1" />
                <span>
                  Lease: {new Date(pendingReview.leaseStartDate).toLocaleDateString('en-GB')} - {' '}
                  {new Date(pendingReview.leaseEndDate).toLocaleDateString('en-GB')}
                </span>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            {pendingReview.daysRemaining} days left
          </Badge>
        </div>

        <p className="text-gray-700 mb-4">
          Share your experience with {pendingReview.otherPartyName} to help future {' '}
          {pendingReview.otherPartyType === 'landlord' ? 'tenants' : 'landlords'} make informed decisions.
        </p>

        <div className="flex space-x-3">
          <Button
            onClick={() => {
              setSelectedPendingReview(pendingReview);
              setShowReviewForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Write Review
          </Button>
          <Button variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            Contact {pendingReview.otherPartyType}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reviews & Ratings</h1>
          <p className="text-gray-600 mt-2">Manage your reviews and see what others are saying</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">4.7</div>
              <div className="flex justify-center mb-2">
                {renderStars(4.7)}
              </div>
              <div className="text-gray-600 text-sm">Average Rating</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">23</div>
              <div className="text-gray-600 text-sm">Total Reviews</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">{mockPendingReviews.length}</div>
              <div className="text-gray-600 text-sm">Pending Reviews</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">95%</div>
              <div className="text-gray-600 text-sm">Recommendation Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-200 p-1 rounded-lg w-fit">
          {[
            { id: 'received', label: 'Reviews About Me', count: mockReviews.filter(r => r.revieweeType === userType).length },
            { id: 'given', label: 'Reviews I Wrote', count: mockReviews.filter(r => r.reviewerType === userType).length },
            { id: 'pending', label: 'Pending Reviews', count: mockPendingReviews.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Filters */}
        {activeTab !== 'pending' && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4+">4+ Stars</option>
                <option value="3+">3+ Stars</option>
                <option value="low">2 Stars or Less</option>
              </select>
            </div>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'pending' ? (
            /* Pending Reviews */
            mockPendingReviews.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No pending reviews</h3>
                <p className="text-gray-500">You're all caught up with your reviews!</p>
              </Card>
            ) : (
              mockPendingReviews.map((pendingReview) => (
                <PendingReviewCard key={pendingReview.id} pendingReview={pendingReview} />
              ))
            )
          ) : (
            /* Regular Reviews */
            filteredReviews.length === 0 ? (
              <Card className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No reviews found</h3>
                <p className="text-gray-500">
                  {activeTab === 'received'
                    ? "You haven't received any reviews yet."
                    : "You haven't written any reviews yet."
                  }
                </p>
              </Card>
            ) : (
              filteredReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            )
          )}
        </div>

        {/* Review Form Modal - Placeholder */}
        {showReviewForm && selectedPendingReview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Write Review for {selectedPendingReview.otherPartyName}</CardTitle>
                <CardDescription>{selectedPendingReview.propertyTitle}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-600 py-8">
                  Review form would be implemented here with rating inputs,
                  text areas for comments, pros/cons, and recommendation toggle.
                </p>
                <div className="flex space-x-3">
                  <Button onClick={() => setShowReviewForm(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                  <Button className="flex-1">
                    Submit Review
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
