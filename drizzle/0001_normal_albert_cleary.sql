CREATE TABLE `activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(255) NOT NULL,
	`entityType` varchar(100),
	`entityId` int,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `athlete_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(30),
	`sport` varchar(100) NOT NULL,
	`position` varchar(100),
	`team` varchar(200),
	`league` varchar(200),
	`bio` text,
	`photoUrl` text,
	`representationStatus` enum('active','inactive','pending','former') NOT NULL DEFAULT 'active',
	`contractValue` bigint,
	`agentId` int,
	`managerId` int,
	`dateOfBirth` date,
	`nationality` varchar(100),
	`city` varchar(100),
	`state` varchar(100),
	`country` varchar(100),
	`instagramHandle` varchar(100),
	`twitterHandle` varchar(100),
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `athlete_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_partners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('Financial Planning','Tax','Legal','Insurance','Real Estate','Investment','Banking','Other') NOT NULL,
	`description` text,
	`website` text,
	`contactEmail` varchar(320),
	`contactPhone` varchar(30),
	`logoUrl` text,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_partners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaign_athletes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`athleteId` int NOT NULL,
	`role` varchar(100),
	`feeCents` bigint,
	`approvalStatus` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaign_athletes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `career_opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`athleteId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`type` enum('Career','NIL','Sponsorship','Endorsement','Event','Media','Speaking','Community') NOT NULL,
	`status` enum('Identified','Contacted','In Negotiation','Offer Received','Accepted','Declined','Converted','Lost') NOT NULL DEFAULT 'Identified',
	`description` text,
	`organization` varchar(255),
	`deadline` date,
	`valueCents` bigint,
	`aiMatchScore` decimal(5,2),
	`assignedToId` int,
	`documentUrl` text,
	`convertedToContractId` int,
	`convertedToCampaignId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `career_opportunities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_outreach` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`type` enum('Youth Program','Charity Event','Mentorship','Workshop','Community Service','Scholarship','Other') NOT NULL,
	`description` text,
	`status` enum('Upcoming','Active','Completed','Cancelled') NOT NULL DEFAULT 'Upcoming',
	`date` date,
	`location` varchar(255),
	`imageUrl` text,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_outreach_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_forms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`athleteId` int NOT NULL,
	`type` enum('Disclosure','Medical Clearance','Background Check','Drug Testing Consent','Financial Disclosure','Travel Authorization','Media Release') NOT NULL,
	`title` varchar(255) NOT NULL,
	`status` enum('DRAFT','SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED') NOT NULL DEFAULT 'DRAFT',
	`description` text,
	`dueDate` date,
	`documentUrl` text,
	`documentKey` text,
	`athleteNotes` text,
	`reviewerNotes` text,
	`reviewerId` int,
	`submittedAt` timestamp,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `compliance_forms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`athleteId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`counterparty` varchar(255),
	`contractType` varchar(100),
	`status` enum('Draft','Active','Expired','Terminated') NOT NULL DEFAULT 'Draft',
	`valueCents` bigint,
	`startDate` date,
	`endDate` date,
	`signedDate` date,
	`renewalDate` date,
	`athleteNote` text,
	`adminNote` text,
	`documentUrl` text,
	`documentKey` text,
	`assignedAgentId` int,
	`milestones` text,
	`tags` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `educational_materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`type` enum('Article','Video','Course','Webinar','Podcast','E-Book','Guide') NOT NULL,
	`description` text,
	`url` text,
	`thumbnailUrl` text,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`sport` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `educational_materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `family_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`athleteId` int NOT NULL,
	`userId` int,
	`name` varchar(200) NOT NULL,
	`relationship` varchar(100) NOT NULL,
	`email` varchar(320),
	`phone` varchar(30),
	`canViewContracts` boolean NOT NULL DEFAULT false,
	`canViewFinancials` boolean NOT NULL DEFAULT false,
	`canMessage` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `family_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketing_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`brand` varchar(255),
	`status` enum('Planning','Active','Paused','Completed','Cancelled') NOT NULL DEFAULT 'Planning',
	`description` text,
	`startDate` date,
	`endDate` date,
	`budgetCents` bigint,
	`assetsUrl` text,
	`managerId` int,
	`deliverables` text,
	`performanceNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketing_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_threads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subject` varchar(255) NOT NULL,
	`athleteId` int,
	`createdBy` int NOT NULL,
	`isArchived` boolean NOT NULL DEFAULT false,
	`lastMessageAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `message_threads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`senderId` int NOT NULL,
	`body` text NOT NULL,
	`attachmentUrl` text,
	`attachmentKey` text,
	`attachmentName` varchar(255),
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`link` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profile_update_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`athleteId` int NOT NULL,
	`requestedBy` int NOT NULL,
	`fieldName` varchar(100) NOT NULL,
	`currentValue` text,
	`requestedValue` text NOT NULL,
	`reason` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `profile_update_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`athleteId` int NOT NULL,
	`userId` int,
	`name` varchar(200) NOT NULL,
	`role` varchar(100) NOT NULL,
	`email` varchar(320),
	`phone` varchar(30),
	`company` varchar(200),
	`isPrimary` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `thread_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`userId` int NOT NULL,
	`lastReadAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `thread_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('owner','admin','agent','manager','marketing_coordinator','compliance_reviewer','athlete','family_member','external_partner') NOT NULL DEFAULT 'athlete';--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `activity_log` ADD CONSTRAINT `activity_log_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `athlete_profiles` ADD CONSTRAINT `athlete_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `athlete_profiles` ADD CONSTRAINT `athlete_profiles_agentId_users_id_fk` FOREIGN KEY (`agentId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `athlete_profiles` ADD CONSTRAINT `athlete_profiles_managerId_users_id_fk` FOREIGN KEY (`managerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campaign_athletes` ADD CONSTRAINT `campaign_athletes_campaignId_marketing_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `marketing_campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campaign_athletes` ADD CONSTRAINT `campaign_athletes_athleteId_athlete_profiles_id_fk` FOREIGN KEY (`athleteId`) REFERENCES `athlete_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `career_opportunities` ADD CONSTRAINT `career_opportunities_athleteId_athlete_profiles_id_fk` FOREIGN KEY (`athleteId`) REFERENCES `athlete_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `career_opportunities` ADD CONSTRAINT `career_opportunities_assignedToId_users_id_fk` FOREIGN KEY (`assignedToId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_forms` ADD CONSTRAINT `compliance_forms_athleteId_athlete_profiles_id_fk` FOREIGN KEY (`athleteId`) REFERENCES `athlete_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_forms` ADD CONSTRAINT `compliance_forms_reviewerId_users_id_fk` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_athleteId_athlete_profiles_id_fk` FOREIGN KEY (`athleteId`) REFERENCES `athlete_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_assignedAgentId_users_id_fk` FOREIGN KEY (`assignedAgentId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `family_members` ADD CONSTRAINT `family_members_athleteId_athlete_profiles_id_fk` FOREIGN KEY (`athleteId`) REFERENCES `athlete_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `family_members` ADD CONSTRAINT `family_members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketing_campaigns` ADD CONSTRAINT `marketing_campaigns_managerId_users_id_fk` FOREIGN KEY (`managerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_threads` ADD CONSTRAINT `message_threads_athleteId_athlete_profiles_id_fk` FOREIGN KEY (`athleteId`) REFERENCES `athlete_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_threads` ADD CONSTRAINT `message_threads_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_threadId_message_threads_id_fk` FOREIGN KEY (`threadId`) REFERENCES `message_threads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_users_id_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profile_update_requests` ADD CONSTRAINT `profile_update_requests_athleteId_athlete_profiles_id_fk` FOREIGN KEY (`athleteId`) REFERENCES `athlete_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profile_update_requests` ADD CONSTRAINT `profile_update_requests_requestedBy_users_id_fk` FOREIGN KEY (`requestedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profile_update_requests` ADD CONSTRAINT `profile_update_requests_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_athleteId_athlete_profiles_id_fk` FOREIGN KEY (`athleteId`) REFERENCES `athlete_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `thread_participants` ADD CONSTRAINT `thread_participants_threadId_message_threads_id_fk` FOREIGN KEY (`threadId`) REFERENCES `message_threads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `thread_participants` ADD CONSTRAINT `thread_participants_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;