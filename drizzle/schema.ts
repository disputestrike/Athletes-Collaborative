import {
  bigint,
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "admin",
  "agent",
  "manager",
  "marketing_coordinator",
  "compliance_reviewer",
  "athlete",
  "family_member",
  "external_partner",
]);

export const representationStatusEnum = pgEnum("representation_status", [
  "active",
  "inactive",
  "pending",
  "prospective",
  "former",
]);

export const tenantStatusEnum = pgEnum("tenant_status", [
  "onboarding",
  "active",
  "paused",
  "archived",
]);

export const signingProviderEnum = pgEnum("signing_provider", [
  "manual",
  "docusign",
  "adobe_sign",
]);

export const mediaAssetTypeEnum = pgEnum("media_asset_type", [
  "image",
  "video",
  "story",
  "document",
]);

export const contentApprovalStatusEnum = pgEnum("content_approval_status", [
  "draft",
  "pending",
  "approved",
  "rejected",
  "archived",
]);

export const crmLeadStatusEnum = pgEnum("crm_lead_status", [
  "new",
  "contacted",
  "meeting_scheduled",
  "post_call",
  "high_level_offer",
  "developmental_nurture",
  "closed_won",
  "closed_lost",
]);

export const meetingProviderEnum = pgEnum("meeting_provider", [
  "zoom",
  "google_meet",
]);

export const followUpPathEnum = pgEnum("follow_up_path", [
  "general",
  "high_level",
  "developmental",
]);

export const profileUpdateStatusEnum = pgEnum("profile_update_status", [
  "pending",
  "approved",
  "rejected",
]);

export const contractStatusEnum = pgEnum("contract_status", [
  "Draft",
  "Active",
  "Expired",
  "Terminated",
]);

export const opportunityTypeEnum = pgEnum("opportunity_type", [
  "Career",
  "NIL",
  "Sponsorship",
  "Endorsement",
  "Event",
  "Media",
  "Speaking",
  "Community",
]);

export const opportunityStatusEnum = pgEnum("opportunity_status", [
  "Identified",
  "Contacted",
  "In Negotiation",
  "Offer Received",
  "Accepted",
  "Declined",
  "Converted",
  "Lost",
]);

export const campaignStatusEnum = pgEnum("campaign_status", [
  "Planning",
  "Active",
  "Paused",
  "Completed",
  "Cancelled",
]);

export const campaignApprovalStatusEnum = pgEnum("campaign_approval_status", [
  "Pending",
  "Approved",
  "Rejected",
]);

export const complianceTypeEnum = pgEnum("compliance_type", [
  "Disclosure",
  "Medical Clearance",
  "Background Check",
  "Drug Testing Consent",
  "Financial Disclosure",
  "Travel Authorization",
  "Media Release",
]);

export const complianceStatusEnum = pgEnum("compliance_status", [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
]);

export const materialTypeEnum = pgEnum("material_type", [
  "Article",
  "Video",
  "Course",
  "Webinar",
  "Podcast",
  "E-Book",
  "Guide",
]);

export const partnerCategoryEnum = pgEnum("partner_category", [
  "Financial Planning",
  "Tax",
  "Legal",
  "Insurance",
  "Real Estate",
  "Investment",
  "Banking",
  "Other",
]);

export const outreachTypeEnum = pgEnum("outreach_type", [
  "Youth Program",
  "Charity Event",
  "Mentorship",
  "Workshop",
  "Community Service",
  "Scholarship",
  "Other",
]);

export const outreachStatusEnum = pgEnum("outreach_status", [
  "Upcoming",
  "Active",
  "Completed",
  "Cancelled",
]);

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  status: tenantStatusEnum("status").default("onboarding").notNull(),
  brandColor: varchar("brandColor", { length: 32 }).default("#F97316"),
  accentColor: varchar("accentColor", { length: 32 }).default("#111827"),
  logoUrl: text("logoUrl"),
  heroImageUrl: text("heroImageUrl"),
  publicDomain: varchar("publicDomain", { length: 255 }),
  portalDomain: varchar("portalDomain", { length: 255 }),
  googleWorkspaceDomain: varchar("googleWorkspaceDomain", { length: 255 }),
  signingProvider: signingProviderEnum("signingProvider")
    .default("manual")
    .notNull(),
  docusignAccountId: varchar("docusignAccountId", { length: 255 }),
  adobeSignAccountId: varchar("adobeSignAccountId", { length: 255 }),
  googleCalendarId: varchar("googleCalendarId", { length: 320 }),
  zoomAccountEmail: varchar("zoomAccountEmail", { length: 320 }),
  signalWireSpaceUrl: text("signalWireSpaceUrl"),
  leadCaptureSlug: varchar("leadCaptureSlug", { length: 120 }),
  intakeFormUrl: text("intakeFormUrl"),
  notes: text("notes"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 128 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("athlete").notNull(),
  avatarUrl: text("avatarUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const tenantMembers = pgTable("tenant_members", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenantId")
    .notNull()
    .references(() => tenants.id),
  userId: integer("userId")
    .notNull()
    .references(() => users.id),
  role: userRoleEnum("role").default("admin").notNull(),
  title: varchar("title", { length: 120 }),
  canManageBranding: boolean("canManageBranding").default(false).notNull(),
  canManageBilling: boolean("canManageBilling").default(false).notNull(),
  canManageLeads: boolean("canManageLeads").default(true).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const athleteProfiles = pgTable("athlete_profiles", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenantId").references(() => tenants.id),
  userId: integer("userId").references(() => users.id),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  sport: varchar("sport", { length: 100 }).notNull(),
  position: varchar("position", { length: 100 }),
  team: varchar("team", { length: 200 }),
  league: varchar("league", { length: 200 }),
  bio: text("bio"),
  photoUrl: text("photoUrl"),
  representationStatus: representationStatusEnum("representationStatus")
    .default("active")
    .notNull(),
  contractValue: bigint("contractValue", { mode: "number" }),
  agentId: integer("agentId").references(() => users.id),
  managerId: integer("managerId").references(() => users.id),
  dateOfBirth: date("dateOfBirth", { mode: "date" }),
  nationality: varchar("nationality", { length: 100 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  instagramHandle: varchar("instagramHandle", { length: 100 }),
  twitterHandle: varchar("twitterHandle", { length: 100 }),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type AthleteProfile = typeof athleteProfiles.$inferSelect;
export type InsertAthleteProfile = typeof athleteProfiles.$inferInsert;

export const profileUpdateRequests = pgTable("profile_update_requests", {
  id: serial("id").primaryKey(),
  athleteId: integer("athleteId")
    .notNull()
    .references(() => athleteProfiles.id),
  requestedBy: integer("requestedBy")
    .notNull()
    .references(() => users.id),
  fieldName: varchar("fieldName", { length: 100 }).notNull(),
  currentValue: text("currentValue"),
  requestedValue: text("requestedValue").notNull(),
  reason: text("reason"),
  status: profileUpdateStatusEnum("status").default("pending").notNull(),
  reviewedBy: integer("reviewedBy").references(() => users.id),
  reviewedAt: timestamp("reviewedAt", { withTimezone: true }),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  athleteId: integer("athleteId")
    .notNull()
    .references(() => athleteProfiles.id),
  userId: integer("userId").references(() => users.id),
  name: varchar("name", { length: 200 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  company: varchar("company", { length: 200 }),
  isPrimary: boolean("isPrimary").default(false).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  athleteId: integer("athleteId")
    .notNull()
    .references(() => athleteProfiles.id),
  userId: integer("userId").references(() => users.id),
  name: varchar("name", { length: 200 }).notNull(),
  relationship: varchar("relationship", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  canViewContracts: boolean("canViewContracts").default(false).notNull(),
  canViewFinancials: boolean("canViewFinancials").default(false).notNull(),
  canMessage: boolean("canMessage").default(true).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  athleteId: integer("athleteId")
    .notNull()
    .references(() => athleteProfiles.id),
  title: varchar("title", { length: 255 }).notNull(),
  counterparty: varchar("counterparty", { length: 255 }),
  contractType: varchar("contractType", { length: 100 }),
  status: contractStatusEnum("status").default("Draft").notNull(),
  valueCents: bigint("valueCents", { mode: "number" }),
  startDate: date("startDate", { mode: "date" }),
  endDate: date("endDate", { mode: "date" }),
  signedDate: date("signedDate", { mode: "date" }),
  renewalDate: date("renewalDate", { mode: "date" }),
  athleteNote: text("athleteNote"),
  adminNote: text("adminNote"),
  documentUrl: text("documentUrl"),
  documentKey: text("documentKey"),
  assignedAgentId: integer("assignedAgentId").references(() => users.id),
  milestones: text("milestones"),
  tags: varchar("tags", { length: 500 }),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

export const careerOpportunities = pgTable("career_opportunities", {
  id: serial("id").primaryKey(),
  athleteId: integer("athleteId")
    .notNull()
    .references(() => athleteProfiles.id),
  title: varchar("title", { length: 255 }).notNull(),
  type: opportunityTypeEnum("type").notNull(),
  status: opportunityStatusEnum("status").default("Identified").notNull(),
  description: text("description"),
  organization: varchar("organization", { length: 255 }),
  deadline: date("deadline", { mode: "date" }),
  valueCents: bigint("valueCents", { mode: "number" }),
  aiMatchScore: numeric("aiMatchScore", { precision: 5, scale: 2 }),
  assignedToId: integer("assignedToId").references(() => users.id),
  documentUrl: text("documentUrl"),
  convertedToContractId: integer("convertedToContractId"),
  convertedToCampaignId: integer("convertedToCampaignId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type CareerOpportunity = typeof careerOpportunities.$inferSelect;
export type InsertCareerOpportunity = typeof careerOpportunities.$inferInsert;

export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 255 }),
  status: campaignStatusEnum("status").default("Planning").notNull(),
  description: text("description"),
  startDate: date("startDate", { mode: "date" }),
  endDate: date("endDate", { mode: "date" }),
  budgetCents: bigint("budgetCents", { mode: "number" }),
  assetsUrl: text("assetsUrl"),
  managerId: integer("managerId").references(() => users.id),
  deliverables: text("deliverables"),
  performanceNotes: text("performanceNotes"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const campaignAthletes = pgTable("campaign_athletes", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaignId")
    .notNull()
    .references(() => marketingCampaigns.id),
  athleteId: integer("athleteId")
    .notNull()
    .references(() => athleteProfiles.id),
  role: varchar("role", { length: 100 }),
  feeCents: bigint("feeCents", { mode: "number" }),
  approvalStatus: campaignApprovalStatusEnum("approvalStatus")
    .default("Pending")
    .notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const complianceForms = pgTable("compliance_forms", {
  id: serial("id").primaryKey(),
  athleteId: integer("athleteId")
    .notNull()
    .references(() => athleteProfiles.id),
  type: complianceTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  status: complianceStatusEnum("status").default("DRAFT").notNull(),
  description: text("description"),
  dueDate: date("dueDate", { mode: "date" }),
  documentUrl: text("documentUrl"),
  documentKey: text("documentKey"),
  athleteNotes: text("athleteNotes"),
  reviewerNotes: text("reviewerNotes"),
  reviewerId: integer("reviewerId").references(() => users.id),
  submittedAt: timestamp("submittedAt", { withTimezone: true }),
  reviewedAt: timestamp("reviewedAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type ComplianceForm = typeof complianceForms.$inferSelect;
export type InsertComplianceForm = typeof complianceForms.$inferInsert;

export const messageThreads = pgTable("message_threads", {
  id: serial("id").primaryKey(),
  subject: varchar("subject", { length: 255 }).notNull(),
  athleteId: integer("athleteId").references(() => athleteProfiles.id),
  createdBy: integer("createdBy")
    .notNull()
    .references(() => users.id),
  isArchived: boolean("isArchived").default(false).notNull(),
  lastMessageAt: timestamp("lastMessageAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  threadId: integer("threadId")
    .notNull()
    .references(() => messageThreads.id),
  senderId: integer("senderId")
    .notNull()
    .references(() => users.id),
  body: text("body").notNull(),
  attachmentUrl: text("attachmentUrl"),
  attachmentKey: text("attachmentKey"),
  attachmentName: varchar("attachmentName", { length: 255 }),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt", { withTimezone: true }),
  sentAt: timestamp("sentAt", { withTimezone: true }).defaultNow().notNull(),
});

export const threadParticipants = pgTable("thread_participants", {
  id: serial("id").primaryKey(),
  threadId: integer("threadId")
    .notNull()
    .references(() => messageThreads.id),
  userId: integer("userId")
    .notNull()
    .references(() => users.id),
  lastReadAt: timestamp("lastReadAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const educationalMaterials = pgTable("educational_materials", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  type: materialTypeEnum("type").notNull(),
  description: text("description"),
  url: text("url"),
  thumbnailUrl: text("thumbnailUrl"),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  sport: varchar("sport", { length: 100 }),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const businessPartners = pgTable("business_partners", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: partnerCategoryEnum("category").notNull(),
  description: text("description"),
  website: text("website"),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 30 }),
  logoUrl: text("logoUrl"),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const communityOutreach = pgTable("community_outreach", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: outreachTypeEnum("type").notNull(),
  description: text("description"),
  status: outreachStatusEnum("status").default("Upcoming").notNull(),
  date: date("date", { mode: "date" }),
  location: varchar("location", { length: 255 }),
  imageUrl: text("imageUrl"),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const athleteLandingPages = pgTable("athlete_landing_pages", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenantId")
    .notNull()
    .references(() => tenants.id),
  athleteId: integer("athleteId")
    .notNull()
    .references(() => athleteProfiles.id),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  headline: varchar("headline", { length: 255 }),
  subheadline: text("subheadline"),
  coverImageUrl: text("coverImageUrl"),
  videoUrl: text("videoUrl"),
  statsJson: text("statsJson"),
  socialLinksJson: text("socialLinksJson"),
  newsJson: text("newsJson"),
  isPublished: boolean("isPublished").default(false).notNull(),
  requiresPassword: boolean("requiresPassword").default(false).notNull(),
  passwordHash: text("passwordHash"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type AthleteLandingPage = typeof athleteLandingPages.$inferSelect;
export type InsertAthleteLandingPage = typeof athleteLandingPages.$inferInsert;

export const athleteMediaAssets = pgTable("athlete_media_assets", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenantId")
    .notNull()
    .references(() => tenants.id),
  athleteId: integer("athleteId")
    .notNull()
    .references(() => athleteProfiles.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  assetType: mediaAssetTypeEnum("assetType").notNull(),
  url: text("url").notNull(),
  storageKey: text("storageKey"),
  thumbnailUrl: text("thumbnailUrl"),
  visibility: varchar("visibility", { length: 32 }).default("private").notNull(),
  approvalStatus: contentApprovalStatusEnum("approvalStatus")
    .default("pending")
    .notNull(),
  submittedBy: integer("submittedBy").references(() => users.id),
  reviewedBy: integer("reviewedBy").references(() => users.id),
  reviewedAt: timestamp("reviewedAt", { withTimezone: true }),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type AthleteMediaAsset = typeof athleteMediaAssets.$inferSelect;
export type InsertAthleteMediaAsset = typeof athleteMediaAssets.$inferInsert;

export const crmLeads = pgTable("crm_leads", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenantId")
    .notNull()
    .references(() => tenants.id),
  source: varchar("source", { length: 120 }).default("lead_magnet"),
  status: crmLeadStatusEnum("status").default("new").notNull(),
  athleteFirstName: varchar("athleteFirstName", { length: 120 }).notNull(),
  athleteLastName: varchar("athleteLastName", { length: 120 }).notNull(),
  athleteEmail: varchar("athleteEmail", { length: 320 }),
  athletePhone: varchar("athletePhone", { length: 30 }),
  athleteSport: varchar("athleteSport", { length: 120 }),
  athleteGraduationYear: varchar("athleteGraduationYear", { length: 16 }),
  guardianName: varchar("guardianName", { length: 200 }),
  guardianEmail: varchar("guardianEmail", { length: 320 }),
  guardianPhone: varchar("guardianPhone", { length: 30 }),
  school: varchar("school", { length: 255 }),
  notes: text("notes"),
  leadScore: integer("leadScore"),
  assignedToId: integer("assignedToId").references(() => users.id),
  nextStep: varchar("nextStep", { length: 255 }),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type CrmLead = typeof crmLeads.$inferSelect;
export type InsertCrmLead = typeof crmLeads.$inferInsert;

export const leadMeetings = pgTable("lead_meetings", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenantId")
    .notNull()
    .references(() => tenants.id),
  leadId: integer("leadId")
    .notNull()
    .references(() => crmLeads.id),
  status: varchar("status", { length: 64 }).default("proposed").notNull(),
  provider: meetingProviderEnum("provider").default("zoom").notNull(),
  startTime: timestamp("startTime", { withTimezone: true }),
  endTime: timestamp("endTime", { withTimezone: true }),
  meetingUrl: text("meetingUrl"),
  calendarEventId: varchar("calendarEventId", { length: 255 }),
  proposedSlotsJson: text("proposedSlotsJson"),
  staffInviteesJson: text("staffInviteesJson"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type LeadMeeting = typeof leadMeetings.$inferSelect;
export type InsertLeadMeeting = typeof leadMeetings.$inferInsert;

export const leadFollowUps = pgTable("lead_follow_ups", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenantId")
    .notNull()
    .references(() => tenants.id),
  leadId: integer("leadId")
    .notNull()
    .references(() => crmLeads.id),
  meetingId: integer("meetingId").references(() => leadMeetings.id),
  path: followUpPathEnum("path").default("general").notNull(),
  channel: varchar("channel", { length: 32 }).default("email").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  triggeredBy: integer("triggeredBy").references(() => users.id),
  sentAt: timestamp("sentAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type LeadFollowUp = typeof leadFollowUps.$inferSelect;
export type InsertLeadFollowUp = typeof leadFollowUps.$inferInsert;

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId")
    .notNull()
    .references(() => users.id),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  isRead: boolean("isRead").default(false).notNull(),
  link: varchar("link", { length: 500 }),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id),
  action: varchar("action", { length: 255 }).notNull(),
  entityType: varchar("entityType", { length: 100 }),
  entityId: integer("entityId"),
  details: text("details"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
