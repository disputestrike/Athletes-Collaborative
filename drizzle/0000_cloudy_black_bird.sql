CREATE TYPE "public"."campaign_approval_status" AS ENUM('Pending', 'Approved', 'Rejected');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('Planning', 'Active', 'Paused', 'Completed', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."compliance_status" AS ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."compliance_type" AS ENUM('Disclosure', 'Medical Clearance', 'Background Check', 'Drug Testing Consent', 'Financial Disclosure', 'Travel Authorization', 'Media Release');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('Draft', 'Active', 'Expired', 'Terminated');--> statement-breakpoint
CREATE TYPE "public"."material_type" AS ENUM('Article', 'Video', 'Course', 'Webinar', 'Podcast', 'E-Book', 'Guide');--> statement-breakpoint
CREATE TYPE "public"."opportunity_status" AS ENUM('Identified', 'Contacted', 'In Negotiation', 'Offer Received', 'Accepted', 'Declined', 'Converted', 'Lost');--> statement-breakpoint
CREATE TYPE "public"."opportunity_type" AS ENUM('Career', 'NIL', 'Sponsorship', 'Endorsement', 'Event', 'Media', 'Speaking', 'Community');--> statement-breakpoint
CREATE TYPE "public"."outreach_status" AS ENUM('Upcoming', 'Active', 'Completed', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."outreach_type" AS ENUM('Youth Program', 'Charity Event', 'Mentorship', 'Workshop', 'Community Service', 'Scholarship', 'Other');--> statement-breakpoint
CREATE TYPE "public"."partner_category" AS ENUM('Financial Planning', 'Tax', 'Legal', 'Insurance', 'Real Estate', 'Investment', 'Banking', 'Other');--> statement-breakpoint
CREATE TYPE "public"."profile_update_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."representation_status" AS ENUM('active', 'inactive', 'pending', 'former');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'admin', 'agent', 'manager', 'marketing_coordinator', 'compliance_reviewer', 'athlete', 'family_member', 'external_partner');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"action" varchar(255) NOT NULL,
	"entityType" varchar(100),
	"entityId" integer,
	"details" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athlete_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"firstName" varchar(100) NOT NULL,
	"lastName" varchar(100) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(30),
	"sport" varchar(100) NOT NULL,
	"position" varchar(100),
	"team" varchar(200),
	"league" varchar(200),
	"bio" text,
	"photoUrl" text,
	"representationStatus" "representation_status" DEFAULT 'active' NOT NULL,
	"contractValue" bigint,
	"agentId" integer,
	"managerId" integer,
	"dateOfBirth" date,
	"nationality" varchar(100),
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100),
	"instagramHandle" varchar(100),
	"twitterHandle" varchar(100),
	"notes" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" "partner_category" NOT NULL,
	"description" text,
	"website" text,
	"contactEmail" varchar(320),
	"contactPhone" varchar(30),
	"logoUrl" text,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_athletes" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaignId" integer NOT NULL,
	"athleteId" integer NOT NULL,
	"role" varchar(100),
	"feeCents" bigint,
	"approvalStatus" "campaign_approval_status" DEFAULT 'Pending' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_opportunities" (
	"id" serial PRIMARY KEY NOT NULL,
	"athleteId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"type" "opportunity_type" NOT NULL,
	"status" "opportunity_status" DEFAULT 'Identified' NOT NULL,
	"description" text,
	"organization" varchar(255),
	"deadline" date,
	"valueCents" bigint,
	"aiMatchScore" numeric(5, 2),
	"assignedToId" integer,
	"documentUrl" text,
	"convertedToContractId" integer,
	"convertedToCampaignId" integer,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_outreach" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"type" "outreach_type" NOT NULL,
	"description" text,
	"status" "outreach_status" DEFAULT 'Upcoming' NOT NULL,
	"date" date,
	"location" varchar(255),
	"imageUrl" text,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_forms" (
	"id" serial PRIMARY KEY NOT NULL,
	"athleteId" integer NOT NULL,
	"type" "compliance_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"status" "compliance_status" DEFAULT 'DRAFT' NOT NULL,
	"description" text,
	"dueDate" date,
	"documentUrl" text,
	"documentKey" text,
	"athleteNotes" text,
	"reviewerNotes" text,
	"reviewerId" integer,
	"submittedAt" timestamp with time zone,
	"reviewedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"athleteId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"counterparty" varchar(255),
	"contractType" varchar(100),
	"status" "contract_status" DEFAULT 'Draft' NOT NULL,
	"valueCents" bigint,
	"startDate" date,
	"endDate" date,
	"signedDate" date,
	"renewalDate" date,
	"athleteNote" text,
	"adminNote" text,
	"documentUrl" text,
	"documentKey" text,
	"assignedAgentId" integer,
	"milestones" text,
	"tags" varchar(500),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "educational_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"type" "material_type" NOT NULL,
	"description" text,
	"url" text,
	"thumbnailUrl" text,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"sport" varchar(100),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"athleteId" integer NOT NULL,
	"userId" integer,
	"name" varchar(200) NOT NULL,
	"relationship" varchar(100) NOT NULL,
	"email" varchar(320),
	"phone" varchar(30),
	"canViewContracts" boolean DEFAULT false NOT NULL,
	"canViewFinancials" boolean DEFAULT false NOT NULL,
	"canMessage" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"brand" varchar(255),
	"status" "campaign_status" DEFAULT 'Planning' NOT NULL,
	"description" text,
	"startDate" date,
	"endDate" date,
	"budgetCents" bigint,
	"assetsUrl" text,
	"managerId" integer,
	"deliverables" text,
	"performanceNotes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject" varchar(255) NOT NULL,
	"athleteId" integer,
	"createdBy" integer NOT NULL,
	"isArchived" boolean DEFAULT false NOT NULL,
	"lastMessageAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"threadId" integer NOT NULL,
	"senderId" integer NOT NULL,
	"body" text NOT NULL,
	"attachmentUrl" text,
	"attachmentKey" text,
	"attachmentName" varchar(255),
	"isRead" boolean DEFAULT false NOT NULL,
	"readAt" timestamp with time zone,
	"sentAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"isRead" boolean DEFAULT false NOT NULL,
	"link" varchar(500),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_update_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"athleteId" integer NOT NULL,
	"requestedBy" integer NOT NULL,
	"fieldName" varchar(100) NOT NULL,
	"currentValue" text,
	"requestedValue" text NOT NULL,
	"reason" text,
	"status" "profile_update_status" DEFAULT 'pending' NOT NULL,
	"reviewedBy" integer,
	"reviewedAt" timestamp with time zone,
	"reviewNote" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"athleteId" integer NOT NULL,
	"userId" integer,
	"name" varchar(200) NOT NULL,
	"role" varchar(100) NOT NULL,
	"email" varchar(320),
	"phone" varchar(30),
	"company" varchar(200),
	"isPrimary" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thread_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"threadId" integer NOT NULL,
	"userId" integer NOT NULL,
	"lastReadAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(128) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'athlete' NOT NULL,
	"avatarUrl" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_profiles" ADD CONSTRAINT "athlete_profiles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_profiles" ADD CONSTRAINT "athlete_profiles_agentId_users_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_profiles" ADD CONSTRAINT "athlete_profiles_managerId_users_id_fk" FOREIGN KEY ("managerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_athletes" ADD CONSTRAINT "campaign_athletes_campaignId_marketing_campaigns_id_fk" FOREIGN KEY ("campaignId") REFERENCES "public"."marketing_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_athletes" ADD CONSTRAINT "campaign_athletes_athleteId_athlete_profiles_id_fk" FOREIGN KEY ("athleteId") REFERENCES "public"."athlete_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_opportunities" ADD CONSTRAINT "career_opportunities_athleteId_athlete_profiles_id_fk" FOREIGN KEY ("athleteId") REFERENCES "public"."athlete_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_opportunities" ADD CONSTRAINT "career_opportunities_assignedToId_users_id_fk" FOREIGN KEY ("assignedToId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_forms" ADD CONSTRAINT "compliance_forms_athleteId_athlete_profiles_id_fk" FOREIGN KEY ("athleteId") REFERENCES "public"."athlete_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_forms" ADD CONSTRAINT "compliance_forms_reviewerId_users_id_fk" FOREIGN KEY ("reviewerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_athleteId_athlete_profiles_id_fk" FOREIGN KEY ("athleteId") REFERENCES "public"."athlete_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_assignedAgentId_users_id_fk" FOREIGN KEY ("assignedAgentId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_athleteId_athlete_profiles_id_fk" FOREIGN KEY ("athleteId") REFERENCES "public"."athlete_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_managerId_users_id_fk" FOREIGN KEY ("managerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_athleteId_athlete_profiles_id_fk" FOREIGN KEY ("athleteId") REFERENCES "public"."athlete_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_threadId_message_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."message_threads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_users_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_update_requests" ADD CONSTRAINT "profile_update_requests_athleteId_athlete_profiles_id_fk" FOREIGN KEY ("athleteId") REFERENCES "public"."athlete_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_update_requests" ADD CONSTRAINT "profile_update_requests_requestedBy_users_id_fk" FOREIGN KEY ("requestedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_update_requests" ADD CONSTRAINT "profile_update_requests_reviewedBy_users_id_fk" FOREIGN KEY ("reviewedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_athleteId_athlete_profiles_id_fk" FOREIGN KEY ("athleteId") REFERENCES "public"."athlete_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_participants" ADD CONSTRAINT "thread_participants_threadId_message_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."message_threads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_participants" ADD CONSTRAINT "thread_participants_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;