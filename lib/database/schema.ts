import { pgTable, text, integer, decimal, boolean, timestamp, uuid, jsonb, index, foreignKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ================================
// USERS & AUTHENTICATION
// ================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  userType: text('user_type').notNull(), // 'tenant' | 'landlord' | 'admin'
  phone: text('phone'),
  dateOfBirth: timestamp('date_of_birth'),
  nationality: text('nationality'),
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  userTypeIdx: index('users_user_type_idx').on(table.userType),
}));

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  providerIdx: index('accounts_provider_idx').on(table.provider, table.providerAccountId),
}));

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionToken: text('session_token').notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  identifierTokenIdx: index('verification_tokens_identifier_token_idx').on(table.identifier, table.token),
}));

// ================================
// USER PROFILES & VERIFICATION
// ================================

export const tenantProfiles = pgTable('tenant_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  category: text('category').notNull(), // 'student', 'professional', 'family', 'senior'
  occupation: text('occupation'),
  monthlyIncome: decimal('monthly_income', { precision: 10, scale: 2 }),
  guarantorInfo: jsonb('guarantor_info'),
  preferences: jsonb('preferences'), // location, price range, amenities
  bio: text('bio'),
  isProfileComplete: boolean('is_profile_complete').default(false),
  verificationStatus: text('verification_status').default('pending'), // 'pending', 'verified', 'rejected'
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const landlordProfiles = pgTable('landlord_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  companyName: text('company_name'),
  businessRegistrationNumber: text('business_registration_number'),
  taxId: text('tax_id'),
  bankAccountInfo: jsonb('bank_account_info'),
  isCompany: boolean('is_company').default(false),
  bio: text('bio'),
  isProfileComplete: boolean('is_profile_complete').default(false),
  verificationStatus: text('verification_status').default('pending'),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userDocuments = pgTable('user_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  documentType: text('document_type').notNull(), // 'id_card', 'passport', 'income_proof', 'employment_letter'
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  mimeType: text('mime_type'),
  fileSize: integer('file_size'),
  verificationStatus: text('verification_status').default('pending'),
  verifiedAt: timestamp('verified_at'),
  rejectionReason: text('rejection_reason'),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
}, (table) => ({
  userDocumentTypeIdx: index('user_documents_user_type_idx').on(table.userId, table.documentType),
}));

// ================================
// PROPERTIES
// ================================

export const properties = pgTable('properties', {
  id: uuid('id').primaryKey().defaultRandom(),
  landlordId: uuid('landlord_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  type: text('type').notNull(), // 'apartment', 'house', 'studio', 'loft'
  status: text('status').default('available'), // 'available', 'rented', 'maintenance', 'draft'

  // Location
  address: text('address').notNull(),
  city: text('city').notNull(),
  region: text('region').notNull(),
  postalCode: text('postal_code'),
  country: text('country').default('Greece'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),

  // Property details
  bedrooms: integer('bedrooms').notNull(),
  bathrooms: integer('bathrooms').notNull(),
  area: decimal('area', { precision: 8, scale: 2 }).notNull(), // square meters
  floor: integer('floor'),
  totalFloors: integer('total_floors'),
  yearBuilt: integer('year_built'),
  furnished: text('furnished').default('unfurnished'), // 'furnished', 'semi_furnished', 'unfurnished'

  // Pricing
  monthlyRent: decimal('monthly_rent', { precision: 10, scale: 2 }).notNull(),
  securityDeposit: decimal('security_deposit', { precision: 10, scale: 2 }).notNull(),
  utilityDeposit: decimal('utility_deposit', { precision: 10, scale: 2 }).default('0'),
  currency: text('currency').default('EUR'),

  // Rules and policies
  petsAllowed: boolean('pets_allowed').default(false),
  smokingAllowed: boolean('smoking_allowed').default(false),
  minimumStayMonths: integer('minimum_stay_months').default(1),
  maximumOccupants: integer('maximum_occupants').notNull(),

  // Features and amenities
  amenities: jsonb('amenities'), // array of amenity IDs
  features: jsonb('features'), // array of features
  nearbyFacilities: jsonb('nearby_facilities'),

  // Media
  mainImage: text('main_image'),
  images: jsonb('images'), // array of image URLs
  virtualTourUrl: text('virtual_tour_url'),

  // SEO and visibility
  slug: text('slug').unique(),
  isPublished: boolean('is_published').default(false),
  publishedAt: timestamp('published_at'),
  viewCount: integer('view_count').default(0),

  // Timestamps
  availableFrom: timestamp('available_from'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  landlordIdx: index('properties_landlord_idx').on(table.landlordId),
  cityIdx: index('properties_city_idx').on(table.city),
  statusIdx: index('properties_status_idx').on(table.status),
  typeIdx: index('properties_type_idx').on(table.type),
  rentIdx: index('properties_rent_idx').on(table.monthlyRent),
  bedroomsIdx: index('properties_bedrooms_idx').on(table.bedrooms),
  locationIdx: index('properties_location_idx').on(table.latitude, table.longitude),
}));

export const propertyAmenities = pgTable('property_amenities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  icon: text('icon'),
  category: text('category').notNull(), // 'essential', 'comfort', 'security', 'entertainment'
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ================================
// BOOKINGS & APPLICATIONS
// ================================

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  landlordId: uuid('landlord_id').notNull().references(() => users.id),

  type: text('type').notNull(), // 'viewing', 'application'
  status: text('status').default('pending'), // 'pending', 'confirmed', 'completed', 'cancelled', 'rejected'

  // Viewing details
  viewingDate: timestamp('viewing_date'),
  viewingTime: text('viewing_time'),
  duration: integer('duration').default(30), // minutes

  // Application details
  moveInDate: timestamp('move_in_date'),
  leaseDuration: integer('lease_duration'), // months
  message: text('message'),

  // Status tracking
  confirmedAt: timestamp('confirmed_at'),
  completedAt: timestamp('completed_at'),
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: text('cancellation_reason'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  propertyIdx: index('bookings_property_idx').on(table.propertyId),
  tenantIdx: index('bookings_tenant_idx').on(table.tenantId),
  landlordIdx: index('bookings_landlord_idx').on(table.landlordId),
  statusIdx: index('bookings_status_idx').on(table.status),
  dateIdx: index('bookings_date_idx').on(table.viewingDate),
}));

export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  landlordId: uuid('landlord_id').notNull().references(() => users.id),

  status: text('status').default('submitted'), // 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn'

  // Application details
  moveInDate: timestamp('move_in_date').notNull(),
  leaseDuration: integer('lease_duration').notNull(), // months
  monthlyIncome: decimal('monthly_income', { precision: 10, scale: 2 }),
  hasGuarantor: boolean('has_guarantor').default(false),
  guarantorInfo: jsonb('guarantor_info'),
  previousRentalHistory: jsonb('previous_rental_history'),
  references: jsonb('references'),

  // Cover letter
  coverLetter: text('cover_letter'),
  additionalInfo: text('additional_info'),

  // Review and decision
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  decision: text('decision'), // 'approved', 'rejected'
  decisionReason: text('decision_reason'),
  decisionAt: timestamp('decision_at'),
  approvedAt: timestamp('approved_at'),
  rejectedAt: timestamp('rejected_at'),
  rejectionReason: text('rejection_reason'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  propertyIdx: index('applications_property_idx').on(table.propertyId),
  tenantIdx: index('applications_tenant_idx').on(table.tenantId),
  statusIdx: index('applications_status_idx').on(table.status),
}));

// ================================
// LEASES & CONTRACTS
// ================================

export const leases = pgTable('leases', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').notNull().references(() => properties.id),
  tenantId: uuid('tenant_id').notNull().references(() => users.id),
  landlordId: uuid('landlord_id').notNull().references(() => users.id),
  applicationId: uuid('application_id').references(() => applications.id),

  // Lease terms
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  monthlyRent: decimal('monthly_rent', { precision: 10, scale: 2 }).notNull(),
  securityDeposit: decimal('security_deposit', { precision: 10, scale: 2 }).notNull(),
  utilityDeposit: decimal('utility_deposit', { precision: 10, scale: 2 }).default('0'),

  // Contract details
  contractId: text('contract_id').unique(),
  contractUrl: text('contract_url'),
  terms: jsonb('terms'),

  // Status
  status: text('status').default('draft'), // 'draft', 'pending_signature', 'active', 'terminated', 'expired'

  // Signatures
  tenantSignedAt: timestamp('tenant_signed_at'),
  landlordSignedAt: timestamp('landlord_signed_at'),
  tenantSignature: text('tenant_signature'),
  landlordSignature: text('landlord_signature'),

  // Termination
  terminatedAt: timestamp('terminated_at'),
  terminationReason: text('termination_reason'),
  terminationNoticeDate: timestamp('termination_notice_date'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  propertyIdx: index('leases_property_idx').on(table.propertyId),
  tenantIdx: index('leases_tenant_idx').on(table.tenantId),
  statusIdx: index('leases_status_idx').on(table.status),
  datesIdx: index('leases_dates_idx').on(table.startDate, table.endDate),
}));

export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  leaseId: uuid('lease_id').notNull().references(() => leases.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').notNull().references(() => properties.id),
  tenantId: uuid('tenant_id').notNull().references(() => users.id),
  landlordId: uuid('landlord_id').notNull().references(() => users.id),

  // Contract details
  title: text('title').notNull(),
  content: text('content').notNull(),
  terms: jsonb('terms'),

  // Status and signatures
  status: text('status').default('draft'), // 'draft', 'pending_signatures', 'signed', 'active', 'terminated'
  templateId: text('template_id'),
  contractHash: text('contract_hash'),

  // File storage
  pdfUrl: text('pdf_url'),
  digitalSignatureRequired: boolean('digital_signature_required').default(true),

  // Dates
  generatedAt: timestamp('generated_at'),
  effectiveDate: timestamp('effective_date'),
  expirationDate: timestamp('expiration_date'),
  signedAt: timestamp('signed_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  leaseIdx: index('contracts_lease_idx').on(table.leaseId),
  statusIdx: index('contracts_status_idx').on(table.status),
  propertyIdx: index('contracts_property_idx').on(table.propertyId),
}));

export const signatures = pgTable('signatures', {
  id: uuid('id').primaryKey().defaultRandom(),
  contractId: uuid('contract_id').notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  signerId: uuid('signer_id').notNull().references(() => users.id),

  // Signature details
  signerRole: text('signer_role').notNull(), // 'tenant', 'landlord', 'guarantor', 'witness'
  signatureType: text('signature_type').notNull(), // 'digital', 'electronic', 'wet'
  signatureData: text('signature_data'), // Base64 encoded signature image or digital signature
  signatureMethod: text('signature_method'), // 'canvas', 'upload', 'typed', 'biometric'

  // Verification
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  geolocation: jsonb('geolocation'),
  timestamp: timestamp('timestamp').notNull(),

  // Legal verification
  isVerified: boolean('is_verified').default(false),
  verificationMethod: text('verification_method'),
  certificateId: text('certificate_id'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  contractIdx: index('signatures_contract_idx').on(table.contractId),
  signerIdx: index('signatures_signer_idx').on(table.signerId),
  timestampIdx: index('signatures_timestamp_idx').on(table.timestamp),
}));

// ================================
// PAYMENTS & FINANCIAL
// ================================

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  leaseId: uuid('lease_id').references(() => leases.id),
  propertyId: uuid('property_id').references(() => properties.id),
  tenantId: uuid('tenant_id').notNull().references(() => users.id),
  landlordId: uuid('landlord_id').notNull().references(() => users.id),

  // Payment details
  type: text('type').notNull(), // 'security_deposit', 'monthly_rent', 'utility_deposit', 'late_fee', 'platform_fee'
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('EUR'),

  // Payment processing
  status: text('status').default('pending'), // 'pending', 'processing', 'completed', 'failed', 'refunded'
  paymentMethod: text('payment_method'), // 'card', 'bank_transfer', 'cash'
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeChargeId: text('stripe_charge_id'),

  // Due dates and periods
  dueDate: timestamp('due_date'),
  periodStart: timestamp('period_start'),
  periodEnd: timestamp('period_end'),

  // Processing timestamps
  paidAt: timestamp('paid_at'),
  failedAt: timestamp('failed_at'),
  refundedAt: timestamp('refunded_at'),
  failureReason: text('failure_reason'),

  // Metadata
  description: text('description'),
  metadata: jsonb('metadata'),
  receiptUrl: text('receipt_url'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('payments_tenant_idx').on(table.tenantId),
  leaseIdx: index('payments_lease_idx').on(table.leaseId),
  statusIdx: index('payments_status_idx').on(table.status),
  typeIdx: index('payments_type_idx').on(table.type),
  dueDateIdx: index('payments_due_date_idx').on(table.dueDate),
}));

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  leaseId: uuid('lease_id').notNull().references(() => leases.id),
  tenantId: uuid('tenant_id').notNull().references(() => users.id),
  propertyId: uuid('property_id').references(() => properties.id),
  landlordId: uuid('landlord_id').references(() => users.id),

  // Stripe details
  stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  stripePriceId: text('stripe_price_id').notNull(),

  // Subscription details
  status: text('status').notNull(), // 'active', 'canceled', 'incomplete', 'past_due'
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('EUR'),

  // Billing
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  billingCycleAnchor: timestamp('billing_cycle_anchor'),
  nextPaymentDate: timestamp('next_payment_date'),

  // Cancellation
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  canceledAt: timestamp('canceled_at'),
  cancellationReason: text('cancellation_reason'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  leaseIdx: index('subscriptions_lease_idx').on(table.leaseId),
  tenantIdx: index('subscriptions_tenant_idx').on(table.tenantId),
  statusIdx: index('subscriptions_status_idx').on(table.status),
}));

// ================================
// COMMUNICATIONS
// ================================

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type').default('direct'), // 'direct', 'group', 'support'
  propertyId: uuid('property_id').references(() => properties.id),

  // Participants
  participants: jsonb('participants').notNull(), // array of user IDs

  // Last message info
  lastMessageId: uuid('last_message_id'),
  lastMessageAt: timestamp('last_message_at'),
  lastMessagePreview: text('last_message_preview'),

  // Status
  isActive: boolean('is_active').default(true),
  isArchived: boolean('is_archived').default(false),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  propertyIdx: index('conversations_property_idx').on(table.propertyId),
  lastMessageIdx: index('conversations_last_message_idx').on(table.lastMessageAt),
}));

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id),

  // Message content
  content: text('content').notNull(),
  type: text('type').default('text'), // 'text', 'image', 'file', 'system'

  // Attachments
  attachments: jsonb('attachments'), // array of file objects

  // Message status
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  readBy: jsonb('read_by'), // array of user IDs and timestamps

  // Reply/thread
  replyToId: uuid('reply_to_id').references(() => messages.id),

  // Edit history
  isEdited: boolean('is_edited').default(false),
  editedAt: timestamp('edited_at'),
  originalContent: text('original_content'),

  // System messages
  isSystemMessage: boolean('is_system_message').default(false),
  systemMessageType: text('system_message_type'), // 'booking_confirmed', 'payment_received', etc.

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  conversationIdx: index('messages_conversation_idx').on(table.conversationId),
  senderIdx: index('messages_sender_idx').on(table.senderId),
  createdAtIdx: index('messages_created_at_idx').on(table.createdAt),
}));

// ================================
// REVIEWS & RATINGS
// ================================

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  leaseId: uuid('lease_id').notNull().references(() => leases.id),
  propertyId: uuid('property_id').notNull().references(() => properties.id),
  reviewerId: uuid('reviewer_id').notNull().references(() => users.id),
  revieweeId: uuid('reviewee_id').notNull().references(() => users.id),

  // Review type
  type: text('type').notNull(), // 'tenant_to_landlord', 'landlord_to_tenant', 'property_review'

  // Ratings (1-5 scale)
  overallRating: integer('overall_rating').notNull(),
  communicationRating: integer('communication_rating'),
  cleanlinessRating: integer('cleanliness_rating'),
  reliabilityRating: integer('reliability_rating'),
  responsivenessRating: integer('responsiveness_rating'),

  // Written review
  title: text('title'),
  content: text('content').notNull(),
  pros: jsonb('pros'), // array of positive points
  cons: jsonb('cons'), // array of negative points

  // Recommendation
  wouldRecommend: boolean('would_recommend'),

  // Verification
  isVerified: boolean('is_verified').default(false),
  verificationBadge: text('verification_badge'), // 'verified_rental', 'verified_stay'

  // Response
  response: text('response'),
  responseAt: timestamp('response_at'),
  responseBy: uuid('response_by').references(() => users.id),

  // Helpfulness
  helpfulCount: integer('helpful_count').default(0),
  notHelpfulCount: integer('not_helpful_count').default(0),

  // Status
  isPublished: boolean('is_published').default(true),
  isFlagged: boolean('is_flagged').default(false),
  flagReason: text('flag_reason'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  propertyIdx: index('reviews_property_idx').on(table.propertyId),
  reviewerIdx: index('reviews_reviewer_idx').on(table.reviewerId),
  revieweeIdx: index('reviews_reviewee_idx').on(table.revieweeId),
  ratingIdx: index('reviews_rating_idx').on(table.overallRating),
}));

export const reviewHelpfulness = pgTable('review_helpfulness', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewId: uuid('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  isHelpful: boolean('is_helpful').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  reviewUserIdx: index('review_helpfulness_review_user_idx').on(table.reviewId, table.userId),
}));

// ================================
// FAVORITES & SAVED SEARCHES
// ================================

export const favorites = pgTable('favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userPropertyIdx: index('favorites_user_property_idx').on(table.userId, table.propertyId),
}));

export const savedSearches = pgTable('saved_searches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  filters: jsonb('filters').notNull(), // search criteria
  alertsEnabled: boolean('alerts_enabled').default(true),
  lastAlertSent: timestamp('last_alert_sent'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('saved_searches_user_idx').on(table.userId),
}));

// ================================
// NOTIFICATIONS
// ================================

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'booking', 'payment', 'message', 'review', 'system'
  title: text('title').notNull(),
  message: text('message').notNull(),

  // Related entities
  relatedEntityType: text('related_entity_type'), // 'property', 'booking', 'payment', etc.
  relatedEntityId: uuid('related_entity_id'),

  // Action
  actionUrl: text('action_url'),
  actionText: text('action_text'),

  // Status
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),

  // Channels
  emailSent: boolean('email_sent').default(false),
  emailSentAt: timestamp('email_sent_at'),
  pushSent: boolean('push_sent').default(false),
  pushSentAt: timestamp('push_sent_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('notifications_user_idx').on(table.userId),
  typeIdx: index('notifications_type_idx').on(table.type),
  isReadIdx: index('notifications_is_read_idx').on(table.isRead),
}));

// ================================
// SYSTEM & ADMIN
// ================================

export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  value: jsonb('value').notNull(),
  description: text('description'),
  isPublic: boolean('is_public').default(false),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('audit_logs_user_idx').on(table.userId),
  entityIdx: index('audit_logs_entity_idx').on(table.entityType, table.entityId),
  actionIdx: index('audit_logs_action_idx').on(table.action),
}));

// ================================
// RELATIONS
// ================================

export const usersRelations = relations(users, ({ one, many }) => ({
  tenantProfile: one(tenantProfiles),
  landlordProfile: one(landlordProfiles),
  accounts: many(accounts),
  sessions: many(sessions),
  documents: many(userDocuments),
  properties: many(properties),
  bookings: many(bookings),
  applications: many(applications),
  tenantLeases: many(leases, { relationName: 'tenantLeases' }),
  landlordLeases: many(leases, { relationName: 'landlordLeases' }),
  sentPayments: many(payments, { relationName: 'sentPayments' }),
  receivedPayments: many(payments, { relationName: 'receivedPayments' }),
  subscriptions: many(subscriptions),
  sentMessages: many(messages),
  reviews: many(reviews),
  favorites: many(favorites),
  savedSearches: many(savedSearches),
  notifications: many(notifications),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  landlord: one(users, {
    fields: [properties.landlordId],
    references: [users.id],
  }),
  bookings: many(bookings),
  applications: many(applications),
  leases: many(leases),
  payments: many(payments),
  reviews: many(reviews),
  favorites: many(favorites),
  conversations: many(conversations),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  property: one(properties, {
    fields: [bookings.propertyId],
    references: [properties.id],
  }),
  tenant: one(users, {
    fields: [bookings.tenantId],
    references: [users.id],
  }),
  landlord: one(users, {
    fields: [bookings.landlordId],
    references: [users.id],
  }),
}));

export const leasesRelations = relations(leases, ({ one, many }) => ({
  property: one(properties, {
    fields: [leases.propertyId],
    references: [properties.id],
  }),
  tenant: one(users, {
    fields: [leases.tenantId],
    references: [users.id],
  }),
  landlord: one(users, {
    fields: [leases.landlordId],
    references: [users.id],
  }),
  application: one(applications, {
    fields: [leases.applicationId],
    references: [applications.id],
  }),
  payments: many(payments),
  subscription: one(subscriptions),
  reviews: many(reviews),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  replyTo: one(messages, {
    fields: [messages.replyToId],
    references: [messages.id],
  }),
  replies: many(messages),
}));

// Export all tables and relations
export const schema = {
  users,
  accounts,
  sessions,
  verificationTokens,
  tenantProfiles,
  landlordProfiles,
  userDocuments,
  properties,
  propertyAmenities,
  bookings,
  applications,
  leases,
  payments,
  subscriptions,
  conversations,
  messages,
  reviews,
  reviewHelpfulness,
  favorites,
  savedSearches,
  notifications,
  systemSettings,
  auditLogs,
  // Relations
  usersRelations,
  propertiesRelations,
  bookingsRelations,
  leasesRelations,
  messagesRelations,
};
