import { and, desc, eq, like, or, sql, count, sum, isNull, isNotNull, gte, lte, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  tenants, InsertTenant,
  users, InsertUser,
  tenantMembers,
  athleteProfiles, InsertAthleteProfile,
  teamMembers, familyMembers,
  contracts, InsertContract,
  careerOpportunities, InsertCareerOpportunity,
  marketingCampaigns, campaignAthletes,
  complianceForms, InsertComplianceForm,
  messageThreads, messages, threadParticipants,
  educationalMaterials, businessPartners, communityOutreach,
  athleteLandingPages, InsertAthleteLandingPage,
  athleteMediaAssets, InsertAthleteMediaAsset,
  crmLeads, InsertCrmLead,
  leadMeetings, InsertLeadMeeting,
  leadFollowUps, InsertLeadFollowUp,
  notifications, activityLog, profileUpdateRequests,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      _client = postgres(ENV.databaseUrl, { max: 10 });
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _client = null;
    }
  }
  return _db;
}

const demoDate = new Date("2026-05-01T12:00:00.000Z");

const demoTenant = {
  id: 1,
  name: "Athletes Collaborative",
  slug: "athletes-collaborative",
  status: "active" as const,
  brandColor: "#F97316",
  accentColor: "#111827",
  logoUrl: null,
  heroImageUrl:
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80",
  publicDomain: null,
  portalDomain: null,
  googleWorkspaceDomain: null,
  signingProvider: "manual" as const,
  docusignAccountId: null,
  adobeSignAccountId: null,
  googleCalendarId: null,
  zoomAccountEmail: null,
  signalWireSpaceUrl: null,
  leadCaptureSlug: "athletes-collaborative",
  intakeFormUrl: null,
  notes:
    "Parent platform for tenant agencies, athlete portals, CRM intake, scheduling, and white-label branding.",
  createdAt: demoDate,
  updatedAt: demoDate,
};

const demoAthlete = {
  id: 1,
  tenantId: 1,
  userId: 1,
  firstName: "Marcus",
  lastName: "Johnson",
  email: "marcus@example.com",
  phone: "(555) 010-2291",
  sport: "Basketball",
  position: "Guard",
  team: "Central Prep",
  league: "High School",
  bio: "Dynamic guard with a strong academic profile and a growing community presence.",
  photoUrl:
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80",
  representationStatus: "active" as const,
  contractValue: 0,
  agentId: null,
  managerId: null,
  dateOfBirth: null,
  nationality: "United States",
  city: "Dallas",
  state: "TX",
  country: "USA",
  instagramHandle: "marcus.hoops",
  twitterHandle: "marcushoops",
  notes: null,
  isActive: true,
  createdAt: demoDate,
  updatedAt: demoDate,
};

const demoLandingPage = {
  id: 1,
  tenantId: 1,
  athleteId: 1,
  slug: "marcus-johnson",
  headline: "Marcus Johnson",
  subheadline:
    "Basketball guard building a complete profile across academics, community impact, and brand-safe NIL opportunities.",
  coverImageUrl:
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80",
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  statsJson: JSON.stringify([
    { label: "PPG", value: "18.4" },
    { label: "GPA", value: "3.8" },
    { label: "Followers", value: "24K" },
  ]),
  socialLinksJson: JSON.stringify([
    { label: "Instagram", url: "https://instagram.com/marcus.hoops" },
    { label: "X", url: "https://x.com/marcushoops" },
  ]),
  newsJson: JSON.stringify([
    {
      title: "Selected for regional showcase",
      date: "2026-04-20",
      summary: "Marcus was invited to the summer regional prospect showcase.",
    },
  ]),
  isPublished: true,
  requiresPassword: false,
  passwordHash: null,
  createdAt: demoDate,
  updatedAt: demoDate,
};

const demoMediaAssets = [
  {
    id: 1,
    tenantId: 1,
    athleteId: 1,
    title: "Showcase action photo",
    description: "Approved landing page image for recruiting and brand packets.",
    assetType: "image" as const,
    url: "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1200&q=80",
    storageKey: null,
    thumbnailUrl: null,
    visibility: "public",
    approvalStatus: "approved" as const,
    submittedBy: 1,
    reviewedBy: 1,
    reviewedAt: demoDate,
    reviewNote: "Approved for public page.",
    createdAt: demoDate,
    updatedAt: demoDate,
  },
  {
    id: 2,
    tenantId: 1,
    athleteId: 1,
    title: "Behind-the-scenes training clip",
    description: "Athlete submission waiting for staff review.",
    assetType: "video" as const,
    url: "https://example.com/training-clip.mp4",
    storageKey: null,
    thumbnailUrl: null,
    visibility: "private",
    approvalStatus: "pending" as const,
    submittedBy: 1,
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
    createdAt: demoDate,
    updatedAt: demoDate,
  },
];

const demoLead = {
  id: 1,
  tenantId: 1,
  source: "SMS lead magnet",
  status: "meeting_scheduled" as const,
  athleteFirstName: "Avery",
  athleteLastName: "Williams",
  athleteEmail: "avery@example.com",
  athletePhone: "(555) 010-1440",
  athleteSport: "Soccer",
  athleteGraduationYear: "2027",
  guardianName: "Dana Williams",
  guardianEmail: "dana@example.com",
  guardianPhone: "(555) 010-1441",
  school: "Northside Academy",
  notes: "Interested in NIL education and family onboarding.",
  leadScore: 84,
  assignedToId: null,
  nextStep: "Confirm parent/athlete Zoom call and send prep material.",
  createdAt: demoDate,
  updatedAt: demoDate,
};

const demoMeeting = {
  id: 1,
  tenantId: 1,
  leadId: 1,
  status: "scheduled",
  provider: "zoom" as const,
  startTime: new Date("2026-05-27T20:00:00.000Z"),
  endTime: new Date("2026-05-27T20:30:00.000Z"),
  meetingUrl: "https://zoom.us/j/demo",
  calendarEventId: "demo-calendar-event",
  proposedSlotsJson: JSON.stringify([
    "2026-05-27T20:00:00.000Z",
    "2026-05-28T19:00:00.000Z",
  ]),
  staffInviteesJson: JSON.stringify(["staff@athletescollaborative.com"]),
  createdAt: demoDate,
  updatedAt: demoDate,
};

const demoFollowUp = {
  id: 1,
  tenantId: 1,
  leadId: 1,
  meetingId: 1,
  path: "high_level" as const,
  channel: "email",
  subject: "Next steps with Athletes Collaborative",
  body:
    "Thank you for meeting with us. Here are the next steps, FAQs, and materials for families reviewing representation.",
  triggeredBy: 1,
  sentAt: null,
  createdAt: demoDate,
};

let demoTenants: any[] = [demoTenant];
let demoAthletes: any[] = [demoAthlete];
let demoLandingPages: any[] = [demoLandingPage];
let demoMediaStore: any[] = [...demoMediaAssets];
let demoLeads: any[] = [demoLead];
let demoMeetings: any[] = [demoMeeting];
let demoFollowUps: any[] = [demoFollowUp];

function useDemoFallback(operation: string, error: unknown) {
  if (ENV.isProduction) throw error;
  console.warn(`[Database] Falling back to demo data for ${operation}:`, error);
}

function shouldUseDemoData() {
  return !ENV.isProduction && process.env.USE_DATABASE_IN_DEV !== "true";
}

function nextDemoId(items: any[]) {
  return Math.max(0, ...items.map(item => Number(item.id) || 0)) + 1;
}

// ─── Tenants / White Label ───────────────────────────────────────────────────

export async function getAllTenants(search?: string) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) {
    const needle = search?.toLowerCase();
    return needle
      ? demoTenants.filter(tenant => `${tenant.name} ${tenant.slug}`.toLowerCase().includes(needle))
      : demoTenants;
  }
  try {
    return await db
      .select()
      .from(tenants)
      .where(
        search
          ? or(like(tenants.name, `%${search}%`), like(tenants.slug, `%${search}%`))
          : undefined
      )
      .orderBy(desc(tenants.createdAt));
  } catch (error) {
    useDemoFallback("getAllTenants", error);
    return [demoTenant];
  }
}

export async function getTenantBySlug(slug: string) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) return demoTenants.find(tenant => tenant.slug === slug);
  try {
    const r = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
    return r[0];
  } catch (error) {
    useDemoFallback("getTenantBySlug", error);
    return slug === demoTenant.slug ? demoTenant : undefined;
  }
}

export async function getTenantById(id: number) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) return demoTenants.find(tenant => tenant.id === id);
  try {
    const r = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    return r[0];
  } catch (error) {
    useDemoFallback("getTenantById", error);
    return id === demoTenant.id ? demoTenant : undefined;
  }
}

export async function createTenant(data: InsertTenant) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) {
    const tenant = { ...demoTenant, ...data, id: nextDemoId(demoTenants), createdAt: new Date(), updatedAt: new Date() };
    demoTenants = [tenant, ...demoTenants];
    return tenant;
  }
  try {
    const r = await db.insert(tenants).values(data).returning();
    return r[0];
  } catch (error) {
    useDemoFallback("createTenant", error);
    return { ...demoTenant, ...data, id: Date.now(), createdAt: new Date(), updatedAt: new Date() };
  }
}

export async function updateTenant(id: number, data: Partial<InsertTenant>) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) {
    const existing = demoTenants.find(tenant => tenant.id === id) ?? demoTenant;
    const updated = { ...existing, ...data, id, updatedAt: new Date() };
    demoTenants = demoTenants.map(tenant => tenant.id === id ? updated : tenant);
    return updated;
  }
  try {
    const r = await db.update(tenants).set({ ...data, updatedAt: new Date() }).where(eq(tenants.id, id)).returning();
    return r[0];
  } catch (error) {
    useDemoFallback("updateTenant", error);
    return { ...demoTenant, ...data, id, updatedAt: new Date() };
  }
}

export async function getTenantOverview(tenantId?: number) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) {
    return {
      tenantCount: demoTenants.length,
      activeTenants: demoTenants.filter(tenant => tenant.status === "active").length,
      athletePages: demoLandingPages.length,
      pendingMedia: demoMediaStore.filter(asset => asset.approvalStatus === "pending").length,
      openLeads: demoLeads.filter(lead => !["closed_won", "closed_lost"].includes(lead.status)).length,
      meetingsScheduled: demoMeetings.filter(meeting => meeting.status === "scheduled").length,
    };
  }

  try {
    const tenantWhere = tenantId ? eq(tenants.id, tenantId) : undefined;
    const pageWhere = tenantId ? eq(athleteLandingPages.tenantId, tenantId) : undefined;
    const mediaWhere = tenantId
      ? and(eq(athleteMediaAssets.tenantId, tenantId), eq(athleteMediaAssets.approvalStatus, "pending"))
      : eq(athleteMediaAssets.approvalStatus, "pending");
    const leadWhere = tenantId
      ? and(eq(crmLeads.tenantId, tenantId), sql`${crmLeads.status} NOT IN ('closed_won', 'closed_lost')`)
      : sql`${crmLeads.status} NOT IN ('closed_won', 'closed_lost')`;
    const meetingWhere = tenantId
      ? and(eq(leadMeetings.tenantId, tenantId), eq(leadMeetings.status, "scheduled"))
      : eq(leadMeetings.status, "scheduled");

    const [tenantCount, activeTenants, pageCount, pendingMedia, openLeads, meetings] = await Promise.all([
      db.select({ c: count() }).from(tenants).where(tenantWhere),
      db.select({ c: count() }).from(tenants).where(
        tenantId ? and(eq(tenants.id, tenantId), eq(tenants.status, "active")) : eq(tenants.status, "active")
      ),
      db.select({ c: count() }).from(athleteLandingPages).where(pageWhere),
      db.select({ c: count() }).from(athleteMediaAssets).where(mediaWhere),
      db.select({ c: count() }).from(crmLeads).where(leadWhere),
      db.select({ c: count() }).from(leadMeetings).where(meetingWhere),
    ]);

    return {
      tenantCount: tenantCount[0]?.c ?? 0,
      activeTenants: activeTenants[0]?.c ?? 0,
      athletePages: pageCount[0]?.c ?? 0,
      pendingMedia: pendingMedia[0]?.c ?? 0,
      openLeads: openLeads[0]?.c ?? 0,
      meetingsScheduled: meetings[0]?.c ?? 0,
    };
  } catch (error) {
    useDemoFallback("getTenantOverview", error);
    return {
      tenantCount: 1,
      activeTenants: 1,
      athletePages: 1,
      pendingMedia: 1,
      openLeads: 1,
      meetingsScheduled: 1,
    };
  }
}

export async function getTenantMembers(tenantId: number) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) return [];
  try {
    return await db.select().from(tenantMembers).where(eq(tenantMembers.tenantId, tenantId));
  } catch (error) {
    useDemoFallback("getTenantMembers", error);
    return [];
  }
}

// ─── Athlete Landing Pages / Media ─────────────────────────────────────────

export async function getAllAthleteLandingPages(tenantId?: number) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) {
    return demoLandingPages
      .filter(page => !tenantId || page.tenantId === tenantId)
      .map(page => ({
        page,
        athlete: demoAthletes.find(athlete => athlete.id === page.athleteId) ?? null,
        tenant: demoTenants.find(tenant => tenant.id === page.tenantId) ?? null,
      }));
  }
  try {
    return await db
      .select({
        page: athleteLandingPages,
        athlete: athleteProfiles,
        tenant: tenants,
      })
      .from(athleteLandingPages)
      .leftJoin(athleteProfiles, eq(athleteLandingPages.athleteId, athleteProfiles.id))
      .leftJoin(tenants, eq(athleteLandingPages.tenantId, tenants.id))
      .where(tenantId ? eq(athleteLandingPages.tenantId, tenantId) : undefined)
      .orderBy(desc(athleteLandingPages.updatedAt));
  } catch (error) {
    useDemoFallback("getAllAthleteLandingPages", error);
    return [{ page: demoLandingPage, athlete: demoAthlete, tenant: demoTenant }];
  }
}

export async function getPublicAthletePage(slug: string) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) {
    const page = demoLandingPages.find(item => item.slug === slug && item.isPublished);
    if (!page) return undefined;
    return {
      page,
      athlete: demoAthletes.find(athlete => athlete.id === page.athleteId) ?? null,
      tenant: demoTenants.find(tenant => tenant.id === page.tenantId) ?? null,
      media: demoMediaStore.filter(asset => asset.athleteId === page.athleteId && asset.approvalStatus === "approved" && asset.visibility === "public"),
    };
  }

  try {
    const r = await db
      .select({
        page: athleteLandingPages,
        athlete: athleteProfiles,
        tenant: tenants,
      })
      .from(athleteLandingPages)
      .leftJoin(athleteProfiles, eq(athleteLandingPages.athleteId, athleteProfiles.id))
      .leftJoin(tenants, eq(athleteLandingPages.tenantId, tenants.id))
      .where(and(eq(athleteLandingPages.slug, slug), eq(athleteLandingPages.isPublished, true)))
      .limit(1);

    const row = r[0];
    if (!row) return undefined;

    const media = await db
      .select()
      .from(athleteMediaAssets)
      .where(
        and(
          eq(athleteMediaAssets.athleteId, row.page.athleteId),
          eq(athleteMediaAssets.approvalStatus, "approved"),
          eq(athleteMediaAssets.visibility, "public")
        )
      )
      .orderBy(desc(athleteMediaAssets.createdAt));

    return { ...row, media };
  } catch (error) {
    useDemoFallback("getPublicAthletePage", error);
    if (slug !== demoLandingPage.slug) return undefined;
    return {
      page: demoLandingPage,
      athlete: demoAthlete,
      tenant: demoTenant,
      media: demoMediaAssets.filter(asset => asset.approvalStatus === "approved" && asset.visibility === "public"),
    };
  }
}

export async function upsertAthleteLandingPage(data: Partial<InsertAthleteLandingPage> & { id?: number }) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) {
    if (data.id) {
      const existing = demoLandingPages.find(page => page.id === data.id) ?? demoLandingPage;
      const updated = { ...existing, ...data, updatedAt: new Date() };
      demoLandingPages = demoLandingPages.map(page => page.id === data.id ? updated : page);
      return updated;
    }
    const page = { ...demoLandingPage, ...data, id: nextDemoId(demoLandingPages), createdAt: new Date(), updatedAt: new Date() };
    demoLandingPages = [page, ...demoLandingPages];
    return page;
  }
  try {
    const { id, ...values } = data;
    if (id) {
      const r = await db
        .update(athleteLandingPages)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(athleteLandingPages.id, id))
        .returning();
      return r[0];
    }
    const r = await db.insert(athleteLandingPages).values(values as InsertAthleteLandingPage).returning();
    return r[0];
  } catch (error) {
    useDemoFallback("upsertAthleteLandingPage", error);
    return { ...demoLandingPage, ...data, updatedAt: new Date() };
  }
}

export async function getAthleteMediaAssets(athleteId?: number, status?: string) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) {
    return demoMediaStore.filter(asset =>
      (!athleteId || asset.athleteId === athleteId) && (!status || asset.approvalStatus === status)
    );
  }
  const filters = [
    athleteId ? eq(athleteMediaAssets.athleteId, athleteId) : undefined,
    status ? eq(athleteMediaAssets.approvalStatus, status as any) : undefined,
  ].filter(Boolean) as any[];
  try {
    return await db
      .select()
      .from(athleteMediaAssets)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(athleteMediaAssets.createdAt));
  } catch (error) {
    useDemoFallback("getAthleteMediaAssets", error);
    return demoMediaAssets.filter(asset =>
      (!athleteId || asset.athleteId === athleteId) && (!status || asset.approvalStatus === status)
    );
  }
}

export async function createAthleteMediaAsset(data: InsertAthleteMediaAsset) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) {
    const asset = { ...demoMediaAssets[1], ...data, id: nextDemoId(demoMediaStore), createdAt: new Date(), updatedAt: new Date() };
    demoMediaStore = [asset, ...demoMediaStore];
    return asset;
  }
  try {
    const r = await db.insert(athleteMediaAssets).values(data).returning();
    return r[0];
  } catch (error) {
    useDemoFallback("createAthleteMediaAsset", error);
    return { ...demoMediaAssets[1], ...data, id: Date.now(), createdAt: new Date(), updatedAt: new Date() };
  }
}

export async function reviewAthleteMediaAsset(
  id: number,
  status: "approved" | "rejected" | "archived",
  reviewedBy: number,
  note?: string
) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) {
    const existing = demoMediaStore.find(asset => asset.id === id);
    const updated = { ...existing, approvalStatus: status, reviewedBy, reviewedAt: new Date(), reviewNote: note ?? null, updatedAt: new Date() };
    demoMediaStore = demoMediaStore.map(asset => asset.id === id ? updated : asset);
    return updated;
  }
  try {
    const r = await db
      .update(athleteMediaAssets)
      .set({ approvalStatus: status, reviewedBy, reviewedAt: new Date(), reviewNote: note ?? null, updatedAt: new Date() })
      .where(eq(athleteMediaAssets.id, id))
      .returning();
    return r[0];
  } catch (error) {
    useDemoFallback("reviewAthleteMediaAsset", error);
    return { ...demoMediaAssets.find(asset => asset.id === id), approvalStatus: status, reviewedBy, reviewNote: note ?? null };
  }
}

// ─── CRM / Scheduling ──────────────────────────────────────────────────────

export async function getCrmLeads(status?: string) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) return demoLeads.filter(lead => !status || lead.status === status);
  try {
    return await db
      .select()
      .from(crmLeads)
      .where(status ? eq(crmLeads.status, status as any) : undefined)
      .orderBy(desc(crmLeads.updatedAt));
  } catch (error) {
    useDemoFallback("getCrmLeads", error);
    return [demoLead].filter(lead => !status || lead.status === status);
  }
}

export async function createCrmLead(data: InsertCrmLead) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) {
    const lead = { ...demoLead, ...data, id: nextDemoId(demoLeads), createdAt: new Date(), updatedAt: new Date() };
    demoLeads = [lead, ...demoLeads];
    return lead;
  }
  try {
    const r = await db.insert(crmLeads).values(data).returning();
    return r[0];
  } catch (error) {
    useDemoFallback("createCrmLead", error);
    return { ...demoLead, ...data, id: Date.now(), createdAt: new Date(), updatedAt: new Date() };
  }
}

export async function updateCrmLead(id: number, data: Partial<InsertCrmLead>) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) {
    const existing = demoLeads.find(lead => lead.id === id) ?? demoLead;
    const updated = { ...existing, ...data, id, updatedAt: new Date() };
    demoLeads = demoLeads.map(lead => lead.id === id ? updated : lead);
    return updated;
  }
  try {
    const r = await db.update(crmLeads).set({ ...data, updatedAt: new Date() }).where(eq(crmLeads.id, id)).returning();
    return r[0];
  } catch (error) {
    useDemoFallback("updateCrmLead", error);
    return { ...demoLead, ...data, id, updatedAt: new Date() };
  }
}

export async function getLeadMeetings(leadId?: number) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) return demoMeetings.filter(meeting => !leadId || meeting.leadId === leadId);
  try {
    return await db
      .select()
      .from(leadMeetings)
      .where(leadId ? eq(leadMeetings.leadId, leadId) : undefined)
      .orderBy(desc(leadMeetings.createdAt));
  } catch (error) {
    useDemoFallback("getLeadMeetings", error);
    return [demoMeeting].filter(meeting => !leadId || meeting.leadId === leadId);
  }
}

export async function createLeadMeeting(data: InsertLeadMeeting) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) {
    const meeting = { ...demoMeeting, ...data, id: nextDemoId(demoMeetings), createdAt: new Date(), updatedAt: new Date() };
    demoMeetings = [meeting, ...demoMeetings];
    return meeting;
  }
  try {
    const r = await db.insert(leadMeetings).values(data).returning();
    return r[0];
  } catch (error) {
    useDemoFallback("createLeadMeeting", error);
    return { ...demoMeeting, ...data, id: Date.now(), createdAt: new Date(), updatedAt: new Date() };
  }
}

export async function getLeadFollowUps(leadId?: number) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) return demoFollowUps.filter(followUp => !leadId || followUp.leadId === leadId);
  try {
    return await db
      .select()
      .from(leadFollowUps)
      .where(leadId ? eq(leadFollowUps.leadId, leadId) : undefined)
      .orderBy(desc(leadFollowUps.createdAt));
  } catch (error) {
    useDemoFallback("getLeadFollowUps", error);
    return [demoFollowUp].filter(followUp => !leadId || followUp.leadId === leadId);
  }
}

export async function createLeadFollowUp(data: InsertLeadFollowUp) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) {
    const followUp = { ...demoFollowUp, ...data, id: nextDemoId(demoFollowUps), createdAt: new Date() };
    demoFollowUps = [followUp, ...demoFollowUps];
    return followUp;
  }
  try {
    const r = await db.insert(leadFollowUps).values(data).returning();
    return r[0];
  } catch (error) {
    useDemoFallback("createLeadFollowUp", error);
    return { ...demoFollowUp, ...data, id: Date.now(), createdAt: new Date() };
  }
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const fields = ["name", "email", "loginMethod", "avatarUrl"] as const;
  for (const f of fields) {
    const v = user[f];
    if (v !== undefined) { values[f] = v ?? null; updateSet[f] = v ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "owner"; updateSet.role = "owner"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db
    .insert(users)
    .values(values)
    .onConflictDoUpdate({
      target: users.openId,
      set: { ...updateSet, updatedAt: new Date() },
    });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return r[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: typeof users.$inferSelect["role"]) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ─── Athletes ────────────────────────────────────────────────────────────────

export async function getAllAthletes(search?: string) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) {
    if (!search) return demoAthletes;
    const needle = search.toLowerCase();
    return demoAthletes.filter(athlete =>
      `${athlete.firstName} ${athlete.lastName} ${athlete.sport} ${athlete.team ?? ""}`.toLowerCase().includes(needle)
    );
  }
  try {
    const q = db.select().from(athleteProfiles).where(
      search
        ? or(
            like(athleteProfiles.firstName, `%${search}%`),
            like(athleteProfiles.lastName, `%${search}%`),
            like(athleteProfiles.sport, `%${search}%`),
            like(athleteProfiles.team, `%${search}%`)
          )
        : undefined
    ).orderBy(desc(athleteProfiles.createdAt));
    return await q;
  } catch (error) {
    useDemoFallback("getAllAthletes", error);
    return [demoAthlete];
  }
}

export async function getAthleteById(id: number) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) return demoAthletes.find(athlete => athlete.id === id);
  try {
    const r = await db.select().from(athleteProfiles).where(eq(athleteProfiles.id, id)).limit(1);
    return r[0];
  } catch (error) {
    useDemoFallback("getAthleteById", error);
    return id === demoAthlete.id ? demoAthlete : undefined;
  }
}

export async function getAthleteByUserId(userId: number) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) return demoAthletes.find(athlete => athlete.userId === userId);
  try {
    const r = await db.select().from(athleteProfiles).where(eq(athleteProfiles.userId, userId)).limit(1);
    return r[0];
  } catch (error) {
    useDemoFallback("getAthleteByUserId", error);
    return userId === demoAthlete.userId ? demoAthlete : undefined;
  }
}

export async function createAthlete(data: InsertAthleteProfile) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const r = await db.insert(athleteProfiles).values(data);
  return r[0];
}

export async function updateAthlete(id: number, data: Partial<InsertAthleteProfile>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(athleteProfiles).set({ ...data, updatedAt: new Date() }).where(eq(athleteProfiles.id, id));
}

export async function deleteAthlete(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(athleteProfiles).where(eq(athleteProfiles.id, id));
}

// ─── Team & Family Members ───────────────────────────────────────────────────

export async function getTeamMembersByAthlete(athleteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teamMembers).where(eq(teamMembers.athleteId, athleteId));
}

export async function createTeamMember(data: typeof teamMembers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(teamMembers).values(data);
}

export async function deleteTeamMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(teamMembers).where(eq(teamMembers.id, id));
}

export async function getFamilyMembersByAthlete(athleteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(familyMembers).where(eq(familyMembers.athleteId, athleteId));
}

export async function createFamilyMember(data: typeof familyMembers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(familyMembers).values(data);
}

export async function deleteFamilyMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(familyMembers).where(eq(familyMembers.id, id));
}

// ─── Profile Update Requests ─────────────────────────────────────────────────

export async function createProfileUpdateRequest(data: typeof profileUpdateRequests.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(profileUpdateRequests).values(data);
}

export async function getPendingUpdateRequests(athleteId?: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(profileUpdateRequests).where(
    athleteId
      ? and(eq(profileUpdateRequests.athleteId, athleteId), eq(profileUpdateRequests.status, "pending"))
      : eq(profileUpdateRequests.status, "pending")
  ).orderBy(desc(profileUpdateRequests.createdAt));
}

export async function reviewUpdateRequest(id: number, status: "approved" | "rejected", reviewedBy: number, note?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(profileUpdateRequests).set({ status, reviewedBy, reviewedAt: new Date(), reviewNote: note ?? null }).where(eq(profileUpdateRequests.id, id));
}

// ─── Contracts ───────────────────────────────────────────────────────────────

export async function getContractsByAthlete(athleteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contracts).where(eq(contracts.athleteId, athleteId)).orderBy(desc(contracts.createdAt));
}

export async function getAllContracts(search?: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contracts).where(
    search ? like(contracts.title, `%${search}%`) : undefined
  ).orderBy(desc(contracts.createdAt));
}

export async function getContractById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  return r[0];
}

export async function createContract(data: InsertContract) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(contracts).values(data);
}

export async function updateContract(id: number, data: Partial<InsertContract>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(contracts).set({ ...data, updatedAt: new Date() }).where(eq(contracts.id, id));
}

export async function deleteContract(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(contracts).where(eq(contracts.id, id));
}

// ─── Opportunities ───────────────────────────────────────────────────────────

export async function getOpportunitiesByAthlete(athleteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(careerOpportunities).where(eq(careerOpportunities.athleteId, athleteId)).orderBy(desc(careerOpportunities.createdAt));
}

export async function getAllOpportunities(search?: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(careerOpportunities).where(
    search ? like(careerOpportunities.title, `%${search}%`) : undefined
  ).orderBy(desc(careerOpportunities.createdAt));
}

export async function getOpportunityById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(careerOpportunities).where(eq(careerOpportunities.id, id)).limit(1);
  return r[0];
}

export async function createOpportunity(data: InsertCareerOpportunity) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(careerOpportunities).values(data);
}

export async function updateOpportunity(id: number, data: Partial<InsertCareerOpportunity>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(careerOpportunities).set({ ...data, updatedAt: new Date() }).where(eq(careerOpportunities.id, id));
}

export async function deleteOpportunity(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(careerOpportunities).where(eq(careerOpportunities.id, id));
}

// ─── Campaigns ───────────────────────────────────────────────────────────────

export async function getAllCampaigns(search?: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(marketingCampaigns).where(
    search ? like(marketingCampaigns.name, `%${search}%`) : undefined
  ).orderBy(desc(marketingCampaigns.createdAt));
}

export async function getCampaignById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(marketingCampaigns).where(eq(marketingCampaigns.id, id)).limit(1);
  return r[0];
}

export async function getCampaignsByAthlete(athleteId: number) {
  const db = await getDb();
  if (!db) return [];
  const assocs = await db.select().from(campaignAthletes).where(eq(campaignAthletes.athleteId, athleteId));
  if (!assocs.length) return [];
  const ids = assocs.map(a => a.campaignId);
  return db.select().from(marketingCampaigns).where(
    sql`${marketingCampaigns.id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`
  );
}

export async function createCampaign(data: typeof marketingCampaigns.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(marketingCampaigns).values(data);
}

export async function updateCampaign(id: number, data: Partial<typeof marketingCampaigns.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(marketingCampaigns).set({ ...data, updatedAt: new Date() }).where(eq(marketingCampaigns.id, id));
}

export async function deleteCampaign(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(marketingCampaigns).where(eq(marketingCampaigns.id, id));
}

export async function getCampaignAthletes(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(campaignAthletes).where(eq(campaignAthletes.campaignId, campaignId));
}

export async function addAthleteToCampaign(data: typeof campaignAthletes.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(campaignAthletes).values(data);
}

// ─── Compliance ───────────────────────────────────────────────────────────────

export async function getComplianceByAthlete(athleteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(complianceForms).where(eq(complianceForms.athleteId, athleteId)).orderBy(desc(complianceForms.createdAt));
}

export async function getAllCompliance(search?: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(complianceForms).where(
    search ? like(complianceForms.title, `%${search}%`) : undefined
  ).orderBy(desc(complianceForms.createdAt));
}

export async function getComplianceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(complianceForms).where(eq(complianceForms.id, id)).limit(1);
  return r[0];
}

export async function createComplianceForm(data: InsertComplianceForm) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(complianceForms).values(data);
}

export async function updateComplianceForm(id: number, data: Partial<InsertComplianceForm>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(complianceForms).set({ ...data, updatedAt: new Date() }).where(eq(complianceForms.id, id));
}

export async function deleteComplianceForm(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(complianceForms).where(eq(complianceForms.id, id));
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function getThreadsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const parts = await db.select().from(threadParticipants).where(eq(threadParticipants.userId, userId));
  if (!parts.length) return [];
  const ids = parts.map(p => p.threadId);
  return db.select().from(messageThreads).where(
    sql`${messageThreads.id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`
  ).orderBy(desc(messageThreads.lastMessageAt));
}

export async function getAllThreads() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messageThreads).orderBy(desc(messageThreads.lastMessageAt));
}

export async function getMessagesByThread(threadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.threadId, threadId)).orderBy(messages.sentAt);
}

export async function createThread(data: typeof messageThreads.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const r = await db.insert(messageThreads).values(data);
  return r;
}

export async function sendMessage(data: typeof messages.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(messages).values(data);
  await db.update(messageThreads).set({ lastMessageAt: new Date() }).where(eq(messageThreads.id, data.threadId));
}

export async function markThreadRead(threadId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(threadParticipants).set({ lastReadAt: new Date() }).where(
    and(eq(threadParticipants.threadId, threadId), eq(threadParticipants.userId, userId))
  );
  await db.update(messages).set({ isRead: true, readAt: new Date() }).where(
    and(eq(messages.threadId, threadId), eq(messages.isRead, false), ne(messages.senderId, userId))
  );
}

export async function addThreadParticipant(threadId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(threadParticipants).values({ threadId, userId }).catch(() => {});
}

export async function getUnreadCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const parts = await db.select().from(threadParticipants).where(eq(threadParticipants.userId, userId));
  if (!parts.length) return 0;
  const threadIds = parts.map(p => p.threadId);
  const r = await db.select({ c: count() }).from(messages).where(
    and(
      sql`${messages.threadId} IN (${sql.join(threadIds.map(id => sql`${id}`), sql`, `)})`,
      eq(messages.isRead, false),
      ne(messages.senderId, userId)
    )
  );
  return r[0]?.c ?? 0;
}

// ─── Growth ───────────────────────────────────────────────────────────────────

export async function getAllMaterials() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(educationalMaterials).orderBy(desc(educationalMaterials.isFeatured), desc(educationalMaterials.createdAt));
}

export async function createMaterial(data: typeof educationalMaterials.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(educationalMaterials).values(data);
}

export async function updateMaterial(id: number, data: Partial<typeof educationalMaterials.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(educationalMaterials).set(data).where(eq(educationalMaterials.id, id));
}

export async function deleteMaterial(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(educationalMaterials).where(eq(educationalMaterials.id, id));
}

export async function getAllPartners() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(businessPartners).orderBy(desc(businessPartners.isFeatured), desc(businessPartners.createdAt));
}

export async function createPartner(data: typeof businessPartners.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(businessPartners).values(data);
}

export async function updatePartner(id: number, data: Partial<typeof businessPartners.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(businessPartners).set(data).where(eq(businessPartners.id, id));
}

export async function deletePartner(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(businessPartners).where(eq(businessPartners.id, id));
}

export async function getAllOutreach() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(communityOutreach).orderBy(desc(communityOutreach.isFeatured), desc(communityOutreach.createdAt));
}

export async function createOutreach(data: typeof communityOutreach.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(communityOutreach).values(data);
}

export async function updateOutreach(id: number, data: Partial<typeof communityOutreach.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(communityOutreach).set(data).where(eq(communityOutreach.id, id));
}

export async function deleteOutreach(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(communityOutreach).where(eq(communityOutreach.id, id));
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function getNotificationsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function createNotification(data: typeof notifications.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

// ─── Activity Log ────────────────────────────────────────────────────────────

export async function logActivity(data: typeof activityLog.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLog).values(data);
}

export async function getRecentActivity(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(limit);
}

// ─── Admin Analytics ─────────────────────────────────────────────────────────

export async function getAdminKPIs() {
  const db = await getDb();
  if (!db || shouldUseDemoData()) return { totalAthletes: 1, activeContracts: 0, openOpportunities: 1, pendingCompliance: 0, totalContractValue: 0, totalCampaigns: 0 };

  const [athletes, activeC, openO, pendingComp, contractVal, campaigns] = await Promise.all([
    db.select({ c: count() }).from(athleteProfiles).where(eq(athleteProfiles.isActive, true)),
    db.select({ c: count() }).from(contracts).where(eq(contracts.status, "Active")),
    db.select({ c: count() }).from(careerOpportunities).where(
      sql`${careerOpportunities.status} NOT IN ('Accepted', 'Declined', 'Converted', 'Lost')`
    ),
    db.select({ c: count() }).from(complianceForms).where(
      sql`${complianceForms.status} IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW')`
    ),
    db.select({ total: sum(contracts.valueCents) }).from(contracts).where(eq(contracts.status, "Active")),
    db.select({ c: count() }).from(marketingCampaigns).where(eq(marketingCampaigns.status, "Active")),
  ]);

  return {
    totalAthletes: athletes[0]?.c ?? 0,
    activeContracts: activeC[0]?.c ?? 0,
    openOpportunities: openO[0]?.c ?? 0,
    pendingCompliance: pendingComp[0]?.c ?? 0,
    totalContractValue: Number(contractVal[0]?.total ?? 0),
    totalCampaigns: campaigns[0]?.c ?? 0,
  };
}

export async function getAthleteKPIs(athleteId: number) {
  const db = await getDb();
  if (!db || shouldUseDemoData()) return { activeContracts: 0, openOpportunities: 1, pendingCompliance: 0, unreadMessages: 0, activeCampaigns: 0 };

  const [activeC, openO, pendingComp, activeCamp] = await Promise.all([
    db.select({ c: count() }).from(contracts).where(and(eq(contracts.athleteId, athleteId), eq(contracts.status, "Active"))),
    db.select({ c: count() }).from(careerOpportunities).where(
      and(eq(careerOpportunities.athleteId, athleteId), sql`${careerOpportunities.status} NOT IN ('Accepted', 'Declined', 'Converted', 'Lost')`)
    ),
    db.select({ c: count() }).from(complianceForms).where(
      and(eq(complianceForms.athleteId, athleteId), sql`${complianceForms.status} IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW')`)
    ),
    db.select({ c: count() }).from(campaignAthletes).where(eq(campaignAthletes.athleteId, athleteId)),
  ]);

  return {
    activeContracts: activeC[0]?.c ?? 0,
    openOpportunities: openO[0]?.c ?? 0,
    pendingCompliance: pendingComp[0]?.c ?? 0,
    activeCampaigns: activeCamp[0]?.c ?? 0,
  };
}

export async function getSportDistribution() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ sport: athleteProfiles.sport, count: count() })
    .from(athleteProfiles)
    .where(eq(athleteProfiles.isActive, true))
    .groupBy(athleteProfiles.sport);
}

export async function getRevenueData() {
  const db = await getDb();
  if (!db) return [];
  // Generate last 12 months of contract value data
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    months.push({ month: label, value: 0 });
  }
  // Get all active contracts with values
  const activeContracts = await db.select({ valueCents: contracts.valueCents, startDate: contracts.startDate })
    .from(contracts)
    .where(eq(contracts.status, "Active"));
  // Distribute contract values across months (simplified: spread over start month)
  for (const c of activeContracts) {
    if (!c.valueCents || !c.startDate) continue;
    const d = new Date(c.startDate);
    const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const idx = months.findIndex(m => m.month === monthLabel);
    if (idx >= 0) months[idx].value += c.valueCents;
  }
  return months;
}

export async function getAdminKPIsWithRenewal() {
  const db = await getDb();
  if (!db || shouldUseDemoData()) return { totalAthletes: 1, activeContracts: 0, openOpportunities: 1, pendingCompliance: 0, totalContractValue: 0, activeCampaigns: 0, renewingSoon: 0 };

  const now = new Date();
  const in90 = new Date(now.getTime() + 90 * 86400000);

  const [athletes, activeC, openO, pendingComp, contractVal, campaigns, renewing] = await Promise.all([
    db.select({ c: count() }).from(athleteProfiles).where(eq(athleteProfiles.isActive, true)),
    db.select({ c: count() }).from(contracts).where(eq(contracts.status, "Active")),
    db.select({ c: count() }).from(careerOpportunities).where(
      sql`${careerOpportunities.status} NOT IN ('Accepted', 'Declined', 'Converted', 'Lost')`
    ),
    db.select({ c: count() }).from(complianceForms).where(
      sql`${complianceForms.status} IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW')`
    ),
    db.select({ total: sum(contracts.valueCents) }).from(contracts).where(eq(contracts.status, "Active")),
    db.select({ c: count() }).from(marketingCampaigns).where(eq(marketingCampaigns.status, "Active")),
    db.select({ c: count() }).from(contracts).where(
      and(eq(contracts.status, "Active"), sql`${contracts.renewalDate} BETWEEN ${now.toISOString()} AND ${in90.toISOString()}`)
    ),
  ]);

  return {
    totalAthletes: athletes[0]?.c ?? 0,
    activeContracts: activeC[0]?.c ?? 0,
    openOpportunities: openO[0]?.c ?? 0,
    pendingCompliance: pendingComp[0]?.c ?? 0,
    totalContractValue: Number(contractVal[0]?.total ?? 0),
    activeCampaigns: campaigns[0]?.c ?? 0,
    renewingSoon: renewing[0]?.c ?? 0,
  };
}
