CREATE TYPE "public"."content_approval_status" AS ENUM('draft', 'pending', 'approved', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "public"."crm_lead_status" AS ENUM('new', 'contacted', 'meeting_scheduled', 'post_call', 'high_level_offer', 'developmental_nurture', 'closed_won', 'closed_lost');--> statement-breakpoint
CREATE TYPE "public"."follow_up_path" AS ENUM('general', 'high_level', 'developmental');--> statement-breakpoint
CREATE TYPE "public"."media_asset_type" AS ENUM('image', 'video', 'story', 'document');--> statement-breakpoint
CREATE TYPE "public"."meeting_provider" AS ENUM('zoom', 'google_meet');--> statement-breakpoint
CREATE TYPE "public"."signing_provider" AS ENUM('manual', 'docusign', 'adobe_sign');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('onboarding', 'active', 'paused', 'archived');--> statement-breakpoint
ALTER TYPE "public"."representation_status" ADD VALUE 'prospective' BEFORE 'former';--> statement-breakpoint
CREATE TABLE "athlete_landing_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer NOT NULL,
	"athleteId" integer NOT NULL,
	"slug" varchar(140) NOT NULL,
	"headline" varchar(255),
	"subheadline" text,
	"coverImageUrl" text,
	"videoUrl" text,
	"statsJson" text,
	"socialLinksJson" text,
	"newsJson" text,
	"isPublished" boolean DEFAULT false NOT NULL,
	"requiresPassword" boolean DEFAULT false NOT NULL,
	"passwordHash" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "athlete_landing_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "athlete_media_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer NOT NULL,
	"athleteId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"assetType" "media_asset_type" NOT NULL,
	"url" text NOT NULL,
	"storageKey" text,
	"thumbnailUrl" text,
	"visibility" varchar(32) DEFAULT 'private' NOT NULL,
	"approvalStatus" "content_approval_status" DEFAULT 'pending' NOT NULL,
	"submittedBy" integer,
	"reviewedBy" integer,
	"reviewedAt" timestamp with time zone,
	"reviewNote" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer NOT NULL,
	"source" varchar(120) DEFAULT 'lead_magnet',
	"status" "crm_lead_status" DEFAULT 'new' NOT NULL,
	"athleteFirstName" varchar(120) NOT NULL,
	"athleteLastName" varchar(120) NOT NULL,
	"athleteEmail" varchar(320),
	"athletePhone" varchar(30),
	"athleteSport" varchar(120),
	"athleteGraduationYear" varchar(16),
	"guardianName" varchar(200),
	"guardianEmail" varchar(320),
	"guardianPhone" varchar(30),
	"school" varchar(255),
	"notes" text,
	"leadScore" integer,
	"assignedToId" integer,
	"nextStep" varchar(255),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_follow_ups" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer NOT NULL,
	"leadId" integer NOT NULL,
	"meetingId" integer,
	"path" "follow_up_path" DEFAULT 'general' NOT NULL,
	"channel" varchar(32) DEFAULT 'email' NOT NULL,
	"subject" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"triggeredBy" integer,
	"sentAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer NOT NULL,
	"leadId" integer NOT NULL,
	"status" varchar(64) DEFAULT 'proposed' NOT NULL,
	"provider" "meeting_provider" DEFAULT 'zoom' NOT NULL,
	"startTime" timestamp with time zone,
	"endTime" timestamp with time zone,
	"meetingUrl" text,
	"calendarEventId" varchar(255),
	"proposedSlotsJson" text,
	"staffInviteesJson" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer NOT NULL,
	"userId" integer NOT NULL,
	"role" "user_role" DEFAULT 'admin' NOT NULL,
	"title" varchar(120),
	"canManageBranding" boolean DEFAULT false NOT NULL,
	"canManageBilling" boolean DEFAULT false NOT NULL,
	"canManageLeads" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"status" "tenant_status" DEFAULT 'onboarding' NOT NULL,
	"brandColor" varchar(32) DEFAULT '#F97316',
	"accentColor" varchar(32) DEFAULT '#111827',
	"logoUrl" text,
	"heroImageUrl" text,
	"publicDomain" varchar(255),
	"portalDomain" varchar(255),
	"googleWorkspaceDomain" varchar(255),
	"signingProvider" "signing_provider" DEFAULT 'manual' NOT NULL,
	"docusignAccountId" varchar(255),
	"adobeSignAccountId" varchar(255),
	"googleCalendarId" varchar(320),
	"zoomAccountEmail" varchar(320),
	"signalWireSpaceUrl" text,
	"leadCaptureSlug" varchar(120),
	"intakeFormUrl" text,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "athlete_profiles" ADD COLUMN "tenantId" integer;--> statement-breakpoint
ALTER TABLE "athlete_landing_pages" ADD CONSTRAINT "athlete_landing_pages_tenantId_tenants_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_landing_pages" ADD CONSTRAINT "athlete_landing_pages_athleteId_athlete_profiles_id_fk" FOREIGN KEY ("athleteId") REFERENCES "public"."athlete_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_media_assets" ADD CONSTRAINT "athlete_media_assets_tenantId_tenants_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_media_assets" ADD CONSTRAINT "athlete_media_assets_athleteId_athlete_profiles_id_fk" FOREIGN KEY ("athleteId") REFERENCES "public"."athlete_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_media_assets" ADD CONSTRAINT "athlete_media_assets_submittedBy_users_id_fk" FOREIGN KEY ("submittedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_media_assets" ADD CONSTRAINT "athlete_media_assets_reviewedBy_users_id_fk" FOREIGN KEY ("reviewedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_tenantId_tenants_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_assignedToId_users_id_fk" FOREIGN KEY ("assignedToId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_follow_ups" ADD CONSTRAINT "lead_follow_ups_tenantId_tenants_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_follow_ups" ADD CONSTRAINT "lead_follow_ups_leadId_crm_leads_id_fk" FOREIGN KEY ("leadId") REFERENCES "public"."crm_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_follow_ups" ADD CONSTRAINT "lead_follow_ups_meetingId_lead_meetings_id_fk" FOREIGN KEY ("meetingId") REFERENCES "public"."lead_meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_follow_ups" ADD CONSTRAINT "lead_follow_ups_triggeredBy_users_id_fk" FOREIGN KEY ("triggeredBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_meetings" ADD CONSTRAINT "lead_meetings_tenantId_tenants_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_meetings" ADD CONSTRAINT "lead_meetings_leadId_crm_leads_id_fk" FOREIGN KEY ("leadId") REFERENCES "public"."crm_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_tenantId_tenants_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_profiles" ADD CONSTRAINT "athlete_profiles_tenantId_tenants_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;