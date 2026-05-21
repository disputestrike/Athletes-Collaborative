import { and, desc, eq, like, or, sql, count, sum, isNull, isNotNull, gte, lte, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users, InsertUser,
  athleteProfiles, InsertAthleteProfile,
  teamMembers, familyMembers,
  contracts, InsertContract,
  careerOpportunities, InsertCareerOpportunity,
  marketingCampaigns, campaignAthletes,
  complianceForms, InsertComplianceForm,
  messageThreads, messages, threadParticipants,
  educationalMaterials, businessPartners, communityOutreach,
  notifications, activityLog, profileUpdateRequests,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
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
  if (!db) return [];
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
  return q;
}

export async function getAthleteById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(athleteProfiles).where(eq(athleteProfiles.id, id)).limit(1);
  return r[0];
}

export async function getAthleteByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(athleteProfiles).where(eq(athleteProfiles.userId, userId)).limit(1);
  return r[0];
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
  if (!db) return { totalAthletes: 0, activeContracts: 0, openOpportunities: 0, pendingCompliance: 0, totalContractValue: 0, totalCampaigns: 0 };

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
  if (!db) return { activeContracts: 0, openOpportunities: 0, pendingCompliance: 0, unreadMessages: 0, activeCampaigns: 0 };

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
  if (!db) return { totalAthletes: 0, activeContracts: 0, openOpportunities: 0, pendingCompliance: 0, totalContractValue: 0, activeCampaigns: 0, renewingSoon: 0 };

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
