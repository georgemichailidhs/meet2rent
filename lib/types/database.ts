import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import {
  users, accounts, sessions, verificationTokens,
  tenantProfiles, landlordProfiles, userDocuments,
  properties, propertyAmenities,
  bookings, applications, leases,
  payments, subscriptions,
  conversations, messages,
  reviews, reviewHelpfulness,
  favorites, savedSearches, notifications,
  systemSettings, auditLogs
} from '../database/schema';

// ================================
// USER TYPES
// ================================

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Account = InferSelectModel<typeof accounts>;
export type NewAccount = InferInsertModel<typeof accounts>;

export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;

export type VerificationToken = InferSelectModel<typeof verificationTokens>;
export type NewVerificationToken = InferInsertModel<typeof verificationTokens>;

// ================================
// PROFILE TYPES
// ================================

export type TenantProfile = InferSelectModel<typeof tenantProfiles>;
export type NewTenantProfile = InferInsertModel<typeof tenantProfiles>;

export type LandlordProfile = InferSelectModel<typeof landlordProfiles>;
export type NewLandlordProfile = InferInsertModel<typeof landlordProfiles>;

export type UserDocument = InferSelectModel<typeof userDocuments>;
export type NewUserDocument = InferInsertModel<typeof userDocuments>;

// ================================
// PROPERTY TYPES
// ================================

export type Property = InferSelectModel<typeof properties>;
export type NewProperty = InferInsertModel<typeof properties>;

export type PropertyAmenity = InferSelectModel<typeof propertyAmenities>;
export type NewPropertyAmenity = InferInsertModel<typeof propertyAmenities>;

// ================================
// BOOKING & APPLICATION TYPES
// ================================

export type Booking = InferSelectModel<typeof bookings>;
export type NewBooking = InferInsertModel<typeof bookings>;

export type Application = InferSelectModel<typeof applications>;
export type NewApplication = InferInsertModel<typeof applications>;

export type Lease = InferSelectModel<typeof leases>;
export type NewLease = InferInsertModel<typeof leases>;

// ================================
// PAYMENT TYPES
// ================================

export type Payment = InferSelectModel<typeof payments>;
export type NewPayment = InferInsertModel<typeof payments>;

export type Subscription = InferSelectModel<typeof subscriptions>;
export type NewSubscription = InferInsertModel<typeof subscriptions>;

// ================================
// COMMUNICATION TYPES
// ================================

export type Conversation = InferSelectModel<typeof conversations>;
export type NewConversation = InferInsertModel<typeof conversations>;

export type Message = InferSelectModel<typeof messages>;
export type NewMessage = InferInsertModel<typeof messages>;

// ================================
// REVIEW TYPES
// ================================

export type Review = InferSelectModel<typeof reviews>;
export type NewReview = InferInsertModel<typeof reviews>;

export type ReviewHelpfulness = InferSelectModel<typeof reviewHelpfulness>;
export type NewReviewHelpfulness = InferInsertModel<typeof reviewHelpfulness>;

// ================================
// USER INTERACTION TYPES
// ================================

export type Favorite = InferSelectModel<typeof favorites>;
export type NewFavorite = InferInsertModel<typeof favorites>;

export type SavedSearch = InferSelectModel<typeof savedSearches>;
export type NewSavedSearch = InferInsertModel<typeof savedSearches>;

export type Notification = InferSelectModel<typeof notifications>;
export type NewNotification = InferInsertModel<typeof notifications>;

// ================================
// SYSTEM TYPES
// ================================

export type SystemSetting = InferSelectModel<typeof systemSettings>;
export type NewSystemSetting = InferInsertModel<typeof systemSettings>;

export type AuditLog = InferSelectModel<typeof auditLogs>;
export type NewAuditLog = InferInsertModel<typeof auditLogs>;

// ================================
// ENHANCED TYPES WITH RELATIONS
// ================================

export interface PropertyWithDetails extends Property {
  landlord: User;
  amenities?: PropertyAmenity[];
  images: string[];
  mainImage?: string;
  isFavorite?: boolean;
  reviewStats?: {
    averageRating: number;
    totalReviews: number;
  };
}

export interface PropertyListItem extends Property {
  landlord: Pick<User, 'id' | 'name' | 'image'>;
  isFavorite?: boolean;
  distance?: number;
}

export interface BookingWithDetails extends Booking {
  property: PropertyListItem;
  tenant: Pick<User, 'id' | 'name' | 'email' | 'image'>;
  landlord: Pick<User, 'id' | 'name' | 'email' | 'image'>;
}

export interface ApplicationWithDetails extends Application {
  property: PropertyListItem;
  tenant: TenantProfile & { user: User };
}

export interface LeaseWithDetails extends Lease {
  property: PropertyListItem;
  tenant: Pick<User, 'id' | 'name' | 'email' | 'image'>;
  landlord: Pick<User, 'id' | 'name' | 'email' | 'image'>;
  payments: Payment[];
  subscription?: Subscription;
}

export interface ConversationWithDetails extends Conversation {
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  property?: PropertyListItem;
}

export interface MessageWithDetails extends Message {
  sender: Pick<User, 'id' | 'name' | 'image'>;
  replyTo?: MessageWithDetails;
  attachments?: FileAttachment[];
}

export interface ReviewWithDetails extends Review {
  reviewer: Pick<User, 'id' | 'name' | 'image'>;
  reviewee: Pick<User, 'id' | 'name' | 'image'>;
  property: PropertyListItem;
  response?: {
    content: string;
    responseAt: Date;
    responseBy: Pick<User, 'id' | 'name' | 'image'>;
  };
  helpfulness: {
    isHelpful?: boolean;
    helpfulCount: number;
    notHelpfulCount: number;
  };
}

export interface UserWithProfile extends User {
  tenantProfile?: TenantProfile;
  landlordProfile?: LandlordProfile;
  documents: UserDocument[];
  isProfileComplete: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

// ================================
// SEARCH & FILTER TYPES
// ================================

export interface PropertySearchFilters {
  query?: string;
  city?: string;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  furnished?: string;
  petsAllowed?: boolean;
  minArea?: number;
  maxArea?: number;
  amenities?: string[];
  availableFrom?: Date;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in km
  };
  sortBy?: 'price_asc' | 'price_desc' | 'date_desc' | 'relevance' | 'distance';
  page?: number;
  limit?: number;
}

export interface PropertySearchResult {
  properties: PropertyListItem[];
  total: number;
  page: number;
  totalPages: number;
  filters: PropertySearchFilters;
}

// ================================
// FILE & UPLOAD TYPES
// ================================

export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

export interface UploadedFile {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  publicId?: string; // For Cloudinary
  folder?: string;
  uploadedAt: Date;
}

// ================================
// FORM TYPES
// ================================

export interface PropertyFormData {
  title: string;
  description: string;
  type: string;
  address: string;
  city: string;
  region: string;
  postalCode?: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  furnished: string;
  monthlyRent: number;
  securityDeposit: number;
  utilityDeposit?: number;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  minimumStayMonths: number;
  maximumOccupants: number;
  amenities: string[];
  features: string[];
  images: string[];
  mainImage?: string;
  virtualTourUrl?: string;
  availableFrom?: Date;
}

export interface BookingFormData {
  propertyId: string;
  type: 'viewing' | 'application';
  viewingDate?: Date;
  viewingTime?: string;
  moveInDate?: Date;
  leaseDuration?: number;
  message?: string;
}

export interface ApplicationFormData extends BookingFormData {
  monthlyIncome?: number;
  hasGuarantor: boolean;
  guarantorInfo?: {
    name: string;
    email: string;
    phone: string;
    relationship: string;
    monthlyIncome?: number;
  };
  previousRentalHistory?: Array<{
    address: string;
    landlordName: string;
    landlordContact: string;
    rentAmount: number;
    duration: string;
    reason: string;
  }>;
  references?: Array<{
    name: string;
    relationship: string;
    contact: string;
  }>;
  coverLetter?: string;
  additionalInfo?: string;
}

export interface ProfileFormData {
  // User basic info
  name: string;
  phone?: string;
  dateOfBirth?: Date;

  // Tenant specific
  category?: string;
  occupation?: string;
  monthlyIncome?: number;
  preferences?: {
    locations: string[];
    minPrice: number;
    maxPrice: number;
    propertyTypes: string[];
    amenities: string[];
  };

  // Landlord specific
  companyName?: string;
  businessRegistrationNumber?: string;
  taxId?: string;
  isCompany?: boolean;

  bio?: string;
}

// ================================
// API RESPONSE TYPES
// ================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ================================
// DASHBOARD TYPES
// ================================

export interface TenantDashboardData {
  user: UserWithProfile;
  activeLeases: LeaseWithDetails[];
  upcomingBookings: BookingWithDetails[];
  pendingApplications: ApplicationWithDetails[];
  recentMessages: ConversationWithDetails[];
  savedProperties: PropertyListItem[];
  notifications: Notification[];
  stats: {
    totalBookings: number;
    totalApplications: number;
    activeLeases: number;
    unreadMessages: number;
  };
}

export interface LandlordDashboardData {
  user: UserWithProfile;
  properties: PropertyWithDetails[];
  activeLeases: LeaseWithDetails[];
  pendingBookings: BookingWithDetails[];
  pendingApplications: ApplicationWithDetails[];
  recentMessages: ConversationWithDetails[];
  payments: Payment[];
  stats: {
    totalProperties: number;
    occupiedProperties: number;
    totalRevenue: number;
    monthlyRevenue: number;
    pendingBookings: number;
    unreadMessages: number;
  };
}

// ================================
// ANALYTICS TYPES
// ================================

export interface PropertyAnalytics {
  propertyId: string;
  views: number;
  favorites: number;
  bookings: number;
  applications: number;
  averageRating: number;
  totalReviews: number;
  viewsThisMonth: number;
  conversionRate: number;
}

export interface UserAnalytics {
  userId: string;
  profileViews: number;
  propertiesViewed: number;
  bookingsMade: number;
  messagesExchanged: number;
  averageResponseTime: number;
  ratings: {
    average: number;
    total: number;
    breakdown: Record<number, number>;
  };
}

// ================================
// NOTIFICATION TYPES
// ================================

export interface NotificationPayload {
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'message' | 'review' | 'system';
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  actionText?: string;
  channels: {
    email?: boolean;
    push?: boolean;
    inApp?: boolean;
  };
}

// ================================
// EXPORT GROUPED TYPES
// ================================

export type {
  // Database entities
  User, NewUser, Account, NewAccount, Session, NewSession,
  TenantProfile, NewTenantProfile, LandlordProfile, NewLandlordProfile,
  Property, NewProperty, PropertyAmenity, NewPropertyAmenity,
  Booking, NewBooking, Application, NewApplication, Lease, NewLease,
  Payment, NewPayment, Subscription, NewSubscription,
  Conversation, NewConversation, Message, NewMessage,
  Review, NewReview, Favorite, NewFavorite, Notification, NewNotification,

  // Enhanced types
  PropertyWithDetails, PropertyListItem, BookingWithDetails,
  ApplicationWithDetails, LeaseWithDetails, ConversationWithDetails,
  MessageWithDetails, ReviewWithDetails, UserWithProfile,

  // Form and API types
  PropertyFormData, BookingFormData, ApplicationFormData, ProfileFormData,
  PropertySearchFilters, PropertySearchResult, ApiResponse, PaginatedResponse,

  // Dashboard and analytics
  TenantDashboardData, LandlordDashboardData, PropertyAnalytics, UserAnalytics,

  // Utility types
  FileAttachment, UploadedFile, NotificationPayload
};
