CREATE TABLE `applications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`propertyId` integer NOT NULL,
	`tenantId` text NOT NULL,
	`landlordId` text NOT NULL,
	`bookingId` integer,
	`status` text DEFAULT 'submitted',
	`moveInDate` integer,
	`leaseDuration` integer,
	`monthlyIncome` real,
	`occupation` text,
	`employerName` text,
	`previousRentalHistory` text,
	`references` text,
	`coverLetter` text,
	`landlordFeedback` text,
	`rejectionReason` text,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tenantId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`landlordId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`propertyId` integer NOT NULL,
	`tenantId` text NOT NULL,
	`landlordId` text NOT NULL,
	`requestedDate` integer NOT NULL,
	`requestedTime` text NOT NULL,
	`confirmedDate` integer,
	`confirmedTime` text,
	`status` text DEFAULT 'pending',
	`tenantMessage` text,
	`landlordResponse` text,
	`tenantNotes` text,
	`landlordNotes` text,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tenantId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`landlordId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`participant1Id` text NOT NULL,
	`participant2Id` text NOT NULL,
	`propertyId` integer,
	`lastMessageId` integer,
	`lastMessageAt` integer DEFAULT CURRENT_TIMESTAMP,
	`isActive` integer DEFAULT true,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`participant1Id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`participant2Id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lastMessageId`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`applicationId` integer,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`mimeType` text,
	`size` integer,
	`verificationStatus` text DEFAULT 'pending',
	`verifiedBy` text,
	`verifiedAt` integer,
	`rejectionReason` text,
	`uploadedAt` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`verifiedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`propertyId` integer NOT NULL,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`senderId` text NOT NULL,
	`receiverId` text NOT NULL,
	`propertyId` integer,
	`bookingId` integer,
	`applicationId` integer,
	`content` text NOT NULL,
	`type` text DEFAULT 'text',
	`attachmentUrl` text,
	`isRead` integer DEFAULT false,
	`readAt` integer,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`receiverId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`relatedEntityType` text,
	`relatedEntityId` text,
	`actionUrl` text,
	`isRead` integer DEFAULT false,
	`readAt` integer,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`landlordId` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`address` text NOT NULL,
	`city` text NOT NULL,
	`area` text,
	`coordinates` text,
	`type` text NOT NULL,
	`bedrooms` integer NOT NULL,
	`bathrooms` integer NOT NULL,
	`squareMeters` integer NOT NULL,
	`floor` integer,
	`price` real NOT NULL,
	`deposit` real,
	`utilities` text DEFAULT 'excluded',
	`availableFrom` integer,
	`minimumStay` integer,
	`maximumStay` integer,
	`features` text,
	`amenities` text,
	`preferredTenantCategories` text,
	`petFriendly` integer DEFAULT false,
	`smokingAllowed` integer DEFAULT false,
	`status` text DEFAULT 'draft',
	`isPublished` integer DEFAULT false,
	`images` text,
	`virtualTourUrl` text,
	`viewCount` integer DEFAULT 0,
	`favoriteCount` integer DEFAULT 0,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`landlordId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `propertyImages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`propertyId` integer NOT NULL,
	`url` text NOT NULL,
	`caption` text,
	`order` integer DEFAULT 0,
	`isPrimary` integer DEFAULT false,
	`uploadedAt` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reviewerId` text NOT NULL,
	`revieweeId` text NOT NULL,
	`propertyId` integer,
	`rating` integer NOT NULL,
	`title` text,
	`content` text,
	`type` text NOT NULL,
	`isPublic` integer DEFAULT true,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`revieweeId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `userVerifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`idDocumentVerified` integer DEFAULT false,
	`idDocumentVerifiedAt` integer,
	`incomeVerified` integer DEFAULT false,
	`incomeVerifiedAt` integer,
	`verifiedIncome` real,
	`employmentVerified` integer DEFAULT false,
	`employmentVerifiedAt` integer,
	`phoneVerified` integer DEFAULT false,
	`phoneVerifiedAt` integer,
	`emailVerified` integer DEFAULT false,
	`emailVerifiedAt` integer,
	`propertyOwnershipVerified` integer DEFAULT false,
	`propertyOwnershipVerifiedAt` integer,
	`verificationLevel` text DEFAULT 'none',
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`emailVerified` integer,
	`image` text,
	`firstName` text,
	`lastName` text,
	`phone` text,
	`userType` text,
	`tenantCategory` text,
	`isVerified` integer DEFAULT false,
	`verificationLevel` text DEFAULT 'none',
	`profileComplete` integer DEFAULT false,
	`language` text DEFAULT 'en',
	`notifications` integer DEFAULT true,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);