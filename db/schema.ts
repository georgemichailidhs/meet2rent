import { sql } from 'drizzle-orm';
import {
  text,
  integer,
  real,
  sqliteTable
} from 'drizzle-orm/sqlite-core';

// Users table - extends NextAuth user data
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'timestamp' }),
  image: text('image'),

  // Meet2Rent specific fields
  firstName: text('firstName'),
  lastName: text('lastName'),
  phone: text('phone'),
  userType: text('userType').$type<'tenant' | 'landlord'>(),
  tenantCategory: text('tenantCategory').$type<'family' | 'student' | 'digital_nomad' | 'family_with_pets' | 'professionals' | 'seniors'>(),

  // Verification status
  isVerified: integer('isVerified', { mode: 'boolean' }).default(false),
  verificationLevel: text('verificationLevel').$type<'none' | 'basic' | 'full'>().default('none'),

  // Profile completeness
  profileComplete: integer('profileComplete', { mode: 'boolean' }).default(false),

  // Settings
  language: text('language').$type<'en' | 'el'>().default('en'),
  notifications: integer('notifications', { mode: 'boolean' }).default(true),

  // Metadata
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Properties table
export const properties = sqliteTable('properties', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  landlordId: text('landlordId').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Basic info
  title: text('title').notNull(),
  description: text('description').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  area: text('area'), // neighborhood
  coordinates: text('coordinates'), // lat,lng for maps

  // Property details
  type: text('type').$type<'apartment' | 'house' | 'studio' | 'loft' | 'villa' | 'maisonette'>().notNull(),
  bedrooms: integer('bedrooms').notNull(),
  bathrooms: integer('bathrooms').notNull(),
  squareMeters: integer('squareMeters').notNull(),
  floor: integer('floor'),

  // Pricing
  price: real('price').notNull(), // monthly rent
  deposit: real('deposit'), // security deposit
  utilities: text('utilities').$type<'included' | 'excluded' | 'partial'>().default('excluded'),

  // Availability
  availableFrom: integer('availableFrom', { mode: 'timestamp' }),
  minimumStay: integer('minimumStay'), // in months
  maximumStay: integer('maximumStay'), // in months

  // Property features (JSON array)
  features: text('features'), // JSON array of feature strings
  amenities: text('amenities'), // JSON array of amenity strings

  // Tenant preferences
  preferredTenantCategories: text('preferredTenantCategories'), // JSON array
  petFriendly: integer('petFriendly', { mode: 'boolean' }).default(false),
  smokingAllowed: integer('smokingAllowed', { mode: 'boolean' }).default(false),

  // Status
  status: text('status').$type<'draft' | 'active' | 'occupied' | 'paused' | 'archived'>().default('draft'),
  isPublished: integer('isPublished', { mode: 'boolean' }).default(false),

  // Media
  images: text('images'), // JSON array of image URLs
  virtualTourUrl: text('virtualTourUrl'),

  // Performance metrics
  viewCount: integer('viewCount').default(0),
  favoriteCount: integer('favoriteCount').default(0),

  // Metadata
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Property images table
export const propertyImages = sqliteTable('propertyImages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  propertyId: integer('propertyId').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  caption: text('caption'),
  order: integer('order').default(0),
  isPrimary: integer('isPrimary', { mode: 'boolean' }).default(false),
  uploadedAt: integer('uploadedAt', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Bookings/Viewing requests table
export const bookings = sqliteTable('bookings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  propertyId: integer('propertyId').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  tenantId: text('tenantId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  landlordId: text('landlordId').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Viewing details
  requestedDate: integer('requestedDate', { mode: 'timestamp' }).notNull(),
  requestedTime: text('requestedTime').notNull(), // e.g., "14:00"
  confirmedDate: integer('confirmedDate', { mode: 'timestamp' }),
  confirmedTime: text('confirmedTime'),

  // Status tracking
  status: text('status').$type<'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected'>().default('pending'),

  // Messages
  tenantMessage: text('tenantMessage'), // initial request message
  landlordResponse: text('landlordResponse'), // landlord's response

  // Notes
  tenantNotes: text('tenantNotes'), // tenant's post-viewing notes
  landlordNotes: text('landlordNotes'), // landlord's notes about tenant

  // Metadata
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Rental applications table
export const applications = sqliteTable('applications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  propertyId: integer('propertyId').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  tenantId: text('tenantId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  landlordId: text('landlordId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  bookingId: integer('bookingId').references(() => bookings.id), // optional reference to viewing

  // Application status
  status: text('status').$type<'submitted' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn'>().default('submitted'),

  // Tenant information
  moveInDate: integer('moveInDate', { mode: 'timestamp' }),
  leaseDuration: integer('leaseDuration'), // in months
  monthlyIncome: real('monthlyIncome'),
  occupation: text('occupation'),
  employerName: text('employerName'),
  previousRentalHistory: text('previousRentalHistory'), // JSON

  // References
  references: text('references'), // JSON array of reference objects

  // Cover letter
  coverLetter: text('coverLetter'),

  // Landlord feedback
  landlordFeedback: text('landlordFeedback'),
  rejectionReason: text('rejectionReason'),

  // Metadata
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Documents table (for verification)
export const documents = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  applicationId: integer('applicationId').references(() => applications.id),

  // Document details
  type: text('type').$type<'id_document' | 'income_proof' | 'employment_letter' | 'bank_statement' | 'previous_lease' | 'reference_letter' | 'other'>().notNull(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  mimeType: text('mimeType'),
  size: integer('size'),

  // Verification status
  verificationStatus: text('verificationStatus').$type<'pending' | 'verified' | 'rejected'>().default('pending'),
  verifiedBy: text('verifiedBy').references(() => users.id),
  verifiedAt: integer('verifiedAt', { mode: 'timestamp' }),
  rejectionReason: text('rejectionReason'),

  // Metadata
  uploadedAt: integer('uploadedAt', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Messages table (for real-time communication)
export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  senderId: text('senderId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiverId: text('receiverId').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Context (what the message is about)
  propertyId: integer('propertyId').references(() => properties.id),
  bookingId: integer('bookingId').references(() => bookings.id),
  applicationId: integer('applicationId').references(() => applications.id),

  // Message content
  content: text('content').notNull(),
  type: text('type').$type<'text' | 'image' | 'document' | 'system'>().default('text'),
  attachmentUrl: text('attachmentUrl'),

  // Status
  isRead: integer('isRead', { mode: 'boolean' }).default(false),
  readAt: integer('readAt', { mode: 'timestamp' }),

  // Metadata
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Conversations table (to group messages)
export const conversations = sqliteTable('conversations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  participant1Id: text('participant1Id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  participant2Id: text('participant2Id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Context
  propertyId: integer('propertyId').references(() => properties.id),

  // Last message info
  lastMessageId: integer('lastMessageId').references(() => messages.id),
  lastMessageAt: integer('lastMessageAt', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),

  // Status
  isActive: integer('isActive', { mode: 'boolean' }).default(true),

  // Metadata
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Favorites table (saved properties)
export const favorites = sqliteTable('favorites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  propertyId: integer('propertyId').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Reviews table
export const reviews = sqliteTable('reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reviewerId: text('reviewerId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  revieweeId: text('revieweeId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  propertyId: integer('propertyId').references(() => properties.id),

  // Review content
  rating: integer('rating').notNull(), // 1-5
  title: text('title'),
  content: text('content'),

  // Review type
  type: text('type').$type<'tenant_to_landlord' | 'landlord_to_tenant' | 'property_review'>().notNull(),

  // Status
  isPublic: integer('isPublic', { mode: 'boolean' }).default(true),

  // Metadata
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Notifications table
export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Notification content
  type: text('type').$type<'booking_request' | 'booking_confirmed' | 'booking_cancelled' | 'application_received' | 'application_status' | 'message_received' | 'document_verified' | 'payment_due' | 'system'>().notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),

  // Related entities
  relatedEntityType: text('relatedEntityType').$type<'property' | 'booking' | 'application' | 'message' | 'user'>(),
  relatedEntityId: text('relatedEntityId'),

  // Action URL
  actionUrl: text('actionUrl'),

  // Status
  isRead: integer('isRead', { mode: 'boolean' }).default(false),
  readAt: integer('readAt', { mode: 'timestamp' }),

  // Metadata
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// User verification table
export const userVerifications = sqliteTable('userVerifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Identity verification
  idDocumentVerified: integer('idDocumentVerified', { mode: 'boolean' }).default(false),
  idDocumentVerifiedAt: integer('idDocumentVerifiedAt', { mode: 'timestamp' }),

  // Income verification (for tenants)
  incomeVerified: integer('incomeVerified', { mode: 'boolean' }).default(false),
  incomeVerifiedAt: integer('incomeVerifiedAt', { mode: 'timestamp' }),
  verifiedIncome: real('verifiedIncome'),

  // Employment verification
  employmentVerified: integer('employmentVerified', { mode: 'boolean' }).default(false),
  employmentVerifiedAt: integer('employmentVerifiedAt', { mode: 'timestamp' }),

  // Phone verification
  phoneVerified: integer('phoneVerified', { mode: 'boolean' }).default(false),
  phoneVerifiedAt: integer('phoneVerifiedAt', { mode: 'timestamp' }),

  // Email verification (handled by NextAuth)
  emailVerified: integer('emailVerified', { mode: 'boolean' }).default(false),
  emailVerifiedAt: integer('emailVerifiedAt', { mode: 'timestamp' }),

  // Property ownership verification (for landlords)
  propertyOwnershipVerified: integer('propertyOwnershipVerified', { mode: 'boolean' }).default(false),
  propertyOwnershipVerifiedAt: integer('propertyOwnershipVerifiedAt', { mode: 'timestamp' }),

  // Overall verification level
  verificationLevel: text('verificationLevel').$type<'none' | 'basic' | 'full'>().default('none'),

  // Metadata
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Export types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type UserVerification = typeof userVerifications.$inferSelect;
export type NewUserVerification = typeof userVerifications.$inferInsert;
