import {
  bigint,
  boolean,
  date,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
} from "drizzle-orm/mysql-core";

// ─── Users / Auth ────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", [
    "owner",
    "admin",
    "agent",
    "manager",
    "marketing_coordinator",
    "compliance_reviewer",
    "athlete",
    "family_member",
    "external_partner",
  ])
    .default("athlete")
    .notNull(),
  avatarUrl: text("avatarUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Athlete Profiles ────────────────────────────────────────────────────────

export const athleteProfiles = mysqlTable("athlete_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
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
  representationStatus: mysqlEnum("representationStatus", [
    "active",
    "inactive",
    "pending",
    "former",
  ])
    .default("active")
    .notNull(),
  contractValue: bigint("contractValue", { mode: "number" }),
  agentId: int("agentId").references(() => users.id),
  managerId: int("managerId").references(() => users.id),
  dateOfBirth: date("dateOfBirth"),
  nationality: varchar("nationality", { length: 100 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  instagramHandle: varchar("instagramHandle", { length: 100 }),
  twitterHandle: varchar("twitterHandle", { length: 100 }),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AthleteProfile = typeof athleteProfiles.$inferSelect;
export type InsertAthleteProfile = typeof athleteProfiles.$inferInsert;

// ─── Profile Update Requests ─────────────────────────────────────────────────

export const profileUpdateRequests = mysqlTable("profile_update_requests", {
  id: int("id").autoincrement().primaryKey(),
  athleteId: int("athleteId")
    .notNull()
    .references(() => athleteProfiles.id),
  requestedBy: int("requestedBy")
    .notNull()
    .references(() => users.id),
  fieldName: varchar("fieldName", { length: 100 }).notNull(),
  currentValue: text("currentValue"),
  requestedValue: text("requestedValue").notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"])
    .default("pending")
    .notNull(),
  reviewedBy: int("reviewedBy").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Team Members ────────────────────────────────────────────────────────────

export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  athleteId: int("athleteId")
    .notNull()
    .references(() => athleteProfiles.id),
  userId: int("userId").references(() => users.id),
  name: varchar("name", { length: 200 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  company: varchar("company", { length: 200 }),
  isPrimary: boolean("isPrimary").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Family Members ──────────────────────────────────────────────────────────

export const familyMembers = mysqlTable("family_members", {
  id: int("id").autoincrement().primaryKey(),
  athleteId: int("athleteId")
    .notNull()
    .references(() => athleteProfiles.id),
  userId: int("userId").references(() => users.id),
  name: varchar("name", { length: 200 }).notNull(),
  relationship: varchar("relationship", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  canViewContracts: boolean("canViewContracts").default(false).notNull(),
  canViewFinancials: boolean("canViewFinancials").default(false).notNull(),
  canMessage: boolean("canMessage").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Contracts ───────────────────────────────────────────────────────────────

export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  athleteId: int("athleteId")
    .notNull()
    .references(() => athleteProfiles.id),
  title: varchar("title", { length: 255 }).notNull(),
  counterparty: varchar("counterparty", { length: 255 }),
  contractType: varchar("contractType", { length: 100 }),
  status: mysqlEnum("status", ["Draft", "Active", "Expired", "Terminated"])
    .default("Draft")
    .notNull(),
  valueCents: bigint("valueCents", { mode: "number" }),
  startDate: date("startDate"),
  endDate: date("endDate"),
  signedDate: date("signedDate"),
  renewalDate: date("renewalDate"),
  athleteNote: text("athleteNote"),
  adminNote: text("adminNote"),
  documentUrl: text("documentUrl"),
  documentKey: text("documentKey"),
  assignedAgentId: int("assignedAgentId").references(() => users.id),
  milestones: text("milestones"),
  tags: varchar("tags", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

// ─── Career Opportunities ────────────────────────────────────────────────────

export const careerOpportunities = mysqlTable("career_opportunities", {
  id: int("id").autoincrement().primaryKey(),
  athleteId: int("athleteId")
    .notNull()
    .references(() => athleteProfiles.id),
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", [
    "Career",
    "NIL",
    "Sponsorship",
    "Endorsement",
    "Event",
    "Media",
    "Speaking",
    "Community",
  ]).notNull(),
  status: mysqlEnum("status", [
    "Identified",
    "Contacted",
    "In Negotiation",
    "Offer Received",
    "Accepted",
    "Declined",
    "Converted",
    "Lost",
  ])
    .default("Identified")
    .notNull(),
  description: text("description"),
  organization: varchar("organization", { length: 255 }),
  deadline: date("deadline"),
  valueCents: bigint("valueCents", { mode: "number" }),
  aiMatchScore: decimal("aiMatchScore", { precision: 5, scale: 2 }),
  assignedToId: int("assignedToId").references(() => users.id),
  documentUrl: text("documentUrl"),
  convertedToContractId: int("convertedToContractId"),
  convertedToCampaignId: int("convertedToCampaignId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CareerOpportunity = typeof careerOpportunities.$inferSelect;
export type InsertCareerOpportunity = typeof careerOpportunities.$inferInsert;

// ─── Marketing Campaigns ─────────────────────────────────────────────────────

export const marketingCampaigns = mysqlTable("marketing_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 255 }),
  status: mysqlEnum("status", [
    "Planning",
    "Active",
    "Paused",
    "Completed",
    "Cancelled",
  ])
    .default("Planning")
    .notNull(),
  description: text("description"),
  startDate: date("startDate"),
  endDate: date("endDate"),
  budgetCents: bigint("budgetCents", { mode: "number" }),
  assetsUrl: text("assetsUrl"),
  managerId: int("managerId").references(() => users.id),
  deliverables: text("deliverables"),
  performanceNotes: text("performanceNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const campaignAthletes = mysqlTable("campaign_athletes", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId")
    .notNull()
    .references(() => marketingCampaigns.id),
  athleteId: int("athleteId")
    .notNull()
    .references(() => athleteProfiles.id),
  role: varchar("role", { length: 100 }),
  feeCents: bigint("feeCents", { mode: "number" }),
  approvalStatus: mysqlEnum("approvalStatus", [
    "Pending",
    "Approved",
    "Rejected",
  ])
    .default("Pending")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Compliance Forms ────────────────────────────────────────────────────────

export const complianceForms = mysqlTable("compliance_forms", {
  id: int("id").autoincrement().primaryKey(),
  athleteId: int("athleteId")
    .notNull()
    .references(() => athleteProfiles.id),
  type: mysqlEnum("type", [
    "Disclosure",
    "Medical Clearance",
    "Background Check",
    "Drug Testing Consent",
    "Financial Disclosure",
    "Travel Authorization",
    "Media Release",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  status: mysqlEnum("status", [
    "DRAFT",
    "SUBMITTED",
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED",
  ])
    .default("DRAFT")
    .notNull(),
  description: text("description"),
  dueDate: date("dueDate"),
  documentUrl: text("documentUrl"),
  documentKey: text("documentKey"),
  athleteNotes: text("athleteNotes"),
  reviewerNotes: text("reviewerNotes"),
  reviewerId: int("reviewerId").references(() => users.id),
  submittedAt: timestamp("submittedAt"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ComplianceForm = typeof complianceForms.$inferSelect;
export type InsertComplianceForm = typeof complianceForms.$inferInsert;

// ─── Message Threads & Messages ──────────────────────────────────────────────

export const messageThreads = mysqlTable("message_threads", {
  id: int("id").autoincrement().primaryKey(),
  subject: varchar("subject", { length: 255 }).notNull(),
  athleteId: int("athleteId").references(() => athleteProfiles.id),
  createdBy: int("createdBy")
    .notNull()
    .references(() => users.id),
  isArchived: boolean("isArchived").default(false).notNull(),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  threadId: int("threadId")
    .notNull()
    .references(() => messageThreads.id),
  senderId: int("senderId")
    .notNull()
    .references(() => users.id),
  body: text("body").notNull(),
  attachmentUrl: text("attachmentUrl"),
  attachmentKey: text("attachmentKey"),
  attachmentName: varchar("attachmentName", { length: 255 }),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export const threadParticipants = mysqlTable("thread_participants", {
  id: int("id").autoincrement().primaryKey(),
  threadId: int("threadId")
    .notNull()
    .references(() => messageThreads.id),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  lastReadAt: timestamp("lastReadAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Growth: Educational Materials ──────────────────────────────────────────

export const educationalMaterials = mysqlTable("educational_materials", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  type: mysqlEnum("type", [
    "Article",
    "Video",
    "Course",
    "Webinar",
    "Podcast",
    "E-Book",
    "Guide",
  ]).notNull(),
  description: text("description"),
  url: text("url"),
  thumbnailUrl: text("thumbnailUrl"),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  sport: varchar("sport", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Growth: Business / Financial Partners ───────────────────────────────────

export const businessPartners = mysqlTable("business_partners", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", [
    "Financial Planning",
    "Tax",
    "Legal",
    "Insurance",
    "Real Estate",
    "Investment",
    "Banking",
    "Other",
  ]).notNull(),
  description: text("description"),
  website: text("website"),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 30 }),
  logoUrl: text("logoUrl"),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Growth: Community Outreach ──────────────────────────────────────────────

export const communityOutreach = mysqlTable("community_outreach", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", [
    "Youth Program",
    "Charity Event",
    "Mentorship",
    "Workshop",
    "Community Service",
    "Scholarship",
    "Other",
  ]).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["Upcoming", "Active", "Completed", "Cancelled"])
    .default("Upcoming")
    .notNull(),
  date: date("date"),
  location: varchar("location", { length: 255 }),
  imageUrl: text("imageUrl"),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Notifications ───────────────────────────────────────────────────────────

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  isRead: boolean("isRead").default(false).notNull(),
  link: varchar("link", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Activity Log ────────────────────────────────────────────────────────────

export const activityLog = mysqlTable("activity_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  action: varchar("action", { length: 255 }).notNull(),
  entityType: varchar("entityType", { length: 100 }),
  entityId: int("entityId"),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
