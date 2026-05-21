import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB ──────────────────────────────────────────────────────────────────

vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getAllUsers: vi.fn().mockResolvedValue([]),
  updateUserRole: vi.fn(),
  getAllAthletes: vi.fn().mockResolvedValue([]),
  getAthleteById: vi.fn().mockResolvedValue(null),
  getAthleteByUserId: vi.fn().mockResolvedValue(null),
  getAthleteKPIs: vi.fn().mockResolvedValue({ activeContracts: 0, openOpportunities: 0, pendingCompliance: 0, activeCampaigns: 0 }),
  createAthlete: vi.fn(),
  updateAthlete: vi.fn(),
  deleteAthlete: vi.fn(),
  getTeamMembersByAthlete: vi.fn().mockResolvedValue([]),
  createTeamMember: vi.fn(),
  deleteTeamMember: vi.fn(),
  getFamilyMembersByAthlete: vi.fn().mockResolvedValue([]),
  createFamilyMember: vi.fn(),
  deleteFamilyMember: vi.fn(),
  createProfileUpdateRequest: vi.fn(),
  getPendingUpdateRequests: vi.fn().mockResolvedValue([]),
  reviewUpdateRequest: vi.fn(),
  getAllContracts: vi.fn().mockResolvedValue([]),
  getContractsByAthlete: vi.fn().mockResolvedValue([]),
  getContractById: vi.fn().mockResolvedValue(null),
  createContract: vi.fn(),
  updateContract: vi.fn(),
  deleteContract: vi.fn(),
  getAllOpportunities: vi.fn().mockResolvedValue([]),
  getOpportunitiesByAthlete: vi.fn().mockResolvedValue([]),
  getOpportunityById: vi.fn().mockResolvedValue(null),
  createOpportunity: vi.fn(),
  updateOpportunity: vi.fn(),
  deleteOpportunity: vi.fn(),
  getAllCampaigns: vi.fn().mockResolvedValue([]),
  getCampaignsByAthlete: vi.fn().mockResolvedValue([]),
  getCampaignById: vi.fn().mockResolvedValue(null),
  getCampaignAthletes: vi.fn().mockResolvedValue([]),
  createCampaign: vi.fn(),
  updateCampaign: vi.fn(),
  deleteCampaign: vi.fn(),
  addAthleteToCampaign: vi.fn(),
  getAllCompliance: vi.fn().mockResolvedValue([]),
  getComplianceByAthlete: vi.fn().mockResolvedValue([]),
  getComplianceById: vi.fn().mockResolvedValue(null),
  createComplianceForm: vi.fn(),
  updateComplianceForm: vi.fn(),
  deleteComplianceForm: vi.fn(),
  getAllThreads: vi.fn().mockResolvedValue([]),
  getThreadsForUser: vi.fn().mockResolvedValue([]),
  getMessagesByThread: vi.fn().mockResolvedValue([]),
  createThread: vi.fn(),
  addThreadParticipant: vi.fn(),
  sendMessage: vi.fn(),
  markThreadRead: vi.fn(),
  getUnreadCount: vi.fn().mockResolvedValue(0),
  getAllMaterials: vi.fn().mockResolvedValue([]),
  createMaterial: vi.fn(),
  updateMaterial: vi.fn(),
  deleteMaterial: vi.fn(),
  getAllPartners: vi.fn().mockResolvedValue([]),
  createPartner: vi.fn(),
  updatePartner: vi.fn(),
  deletePartner: vi.fn(),
  getAllOutreach: vi.fn().mockResolvedValue([]),
  createOutreach: vi.fn(),
  updateOutreach: vi.fn(),
  deleteOutreach: vi.fn(),
  getAdminKPIs: vi.fn().mockResolvedValue({ totalAthletes: 0, activeContracts: 0, openOpportunities: 0, pendingCompliance: 0, totalContractValue: 0, activeCampaigns: 0 }),
  getAdminKPIsWithRenewal: vi.fn().mockResolvedValue({ totalAthletes: 5, activeContracts: 3, openOpportunities: 8, pendingCompliance: 2, totalContractValue: 500000, activeCampaigns: 4, renewingSoon: 1 }),
  getRecentActivity: vi.fn().mockResolvedValue([]),
  getRevenueData: vi.fn().mockResolvedValue([]),
  getSportDistribution: vi.fn().mockResolvedValue([]),
  getNotificationsForUser: vi.fn().mockResolvedValue([]),
  markNotificationRead: vi.fn(),
  logActivity: vi.fn(),
}));

// ─── Context factories ────────────────────────────────────────────────────────

function makeCtx(role: string = "athlete", userId: number = 1): TrpcContext {
  const clearedCookies: any[] = [];
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user${userId}@test.com`,
      name: "Test User",
      loginMethod: "manus",
      role: role as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as any,
    res: {
      clearCookie: (name: string, opts: any) => clearedCookies.push({ name, opts }),
    } as any,
  };
}

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────

describe("auth", () => {
  it("me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user for authenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx("athlete"));
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.role).toBe("athlete");
  });

  it("logout clears session cookie", async () => {
    const ctx = makeCtx("athlete");
    const clearedCookies: any[] = [];
    ctx.res.clearCookie = (name: string, opts: any) => clearedCookies.push({ name, opts });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

// ─── Role-based access tests ──────────────────────────────────────────────────

describe("role-based access control", () => {
  it("athlete cannot create contracts (staff only)", async () => {
    const caller = appRouter.createCaller(makeCtx("athlete"));
    await expect(
      caller.contracts.create({
        athleteId: 1,
        title: "Test Contract",
      })
    ).rejects.toThrow("Staff access required");
  });

  it("agent can create contracts", async () => {
    const caller = appRouter.createCaller(makeCtx("agent"));
    await expect(
      caller.contracts.create({
        athleteId: 1,
        title: "Test Contract",
      })
    ).resolves.not.toThrow();
  });

  it("athlete cannot delete contracts (admin only)", async () => {
    const caller = appRouter.createCaller(makeCtx("athlete"));
    await expect(caller.contracts.delete({ id: 1 })).rejects.toThrow("Admin access required");
  });

  it("admin can delete contracts", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    await expect(caller.contracts.delete({ id: 1 })).resolves.not.toThrow();
  });

  it("athlete cannot create opportunities", async () => {
    const caller = appRouter.createCaller(makeCtx("athlete"));
    await expect(
      caller.opportunities.create({
        athleteId: 1,
        title: "Test Opp",
        type: "NIL",
      })
    ).rejects.toThrow("Staff access required");
  });

  it("manager can create opportunities", async () => {
    const caller = appRouter.createCaller(makeCtx("manager"));
    await expect(
      caller.opportunities.create({
        athleteId: 1,
        title: "Test Opp",
        type: "NIL",
      })
    ).resolves.not.toThrow();
  });

  it("athlete cannot update user roles", async () => {
    const caller = appRouter.createCaller(makeCtx("athlete"));
    await expect(
      caller.admin.updateUserRole({ userId: 2, role: "agent" })
    ).rejects.toThrow("Admin access required");
  });
});

// ─── Compliance workflow tests ────────────────────────────────────────────────

describe("compliance state machine", () => {
  it("cannot submit a non-DRAFT form", async () => {
    const mockDb = await import("./db");
    vi.mocked(mockDb.getComplianceById).mockResolvedValueOnce({
      id: 1, status: "SUBMITTED", athleteId: 1, type: "Disclosure", title: "Test",
      description: null, dueDate: null, athleteNotes: null, reviewerNotes: null,
      reviewerId: null, submittedAt: null, reviewedAt: null, documentUrl: null,
      createdAt: new Date(), updatedAt: new Date(),
    } as any);

    const caller = appRouter.createCaller(makeCtx("athlete"));
    await expect(caller.compliance.submit({ id: 1 })).rejects.toThrow(
      "Only DRAFT forms can be submitted"
    );
  });

  it("cannot approve a non-UNDER_REVIEW form", async () => {
    const mockDb = await import("./db");
    vi.mocked(mockDb.getComplianceById).mockResolvedValueOnce({
      id: 1, status: "SUBMITTED", athleteId: 1, type: "Disclosure", title: "Test",
      description: null, dueDate: null, athleteNotes: null, reviewerNotes: null,
      reviewerId: null, submittedAt: null, reviewedAt: null, documentUrl: null,
      createdAt: new Date(), updatedAt: new Date(),
    } as any);

    const caller = appRouter.createCaller(makeCtx("compliance_reviewer"));
    await expect(caller.compliance.approve({ id: 1 })).rejects.toThrow(
      "Only UNDER_REVIEW forms can be approved"
    );
  });

  it("can approve an UNDER_REVIEW form", async () => {
    const mockDb = await import("./db");
    vi.mocked(mockDb.getComplianceById).mockResolvedValueOnce({
      id: 1, status: "UNDER_REVIEW", athleteId: 1, type: "Disclosure", title: "Test",
      description: null, dueDate: null, athleteNotes: null, reviewerNotes: null,
      reviewerId: null, submittedAt: null, reviewedAt: null, documentUrl: null,
      createdAt: new Date(), updatedAt: new Date(),
    } as any);

    const caller = appRouter.createCaller(makeCtx("compliance_reviewer"));
    await expect(
      caller.compliance.approve({ id: 1, reviewerNotes: "Looks good" })
    ).resolves.not.toThrow();
  });

  it("combined review action works for approve", async () => {
    const mockDb = await import("./db");
    vi.mocked(mockDb.getComplianceById).mockResolvedValueOnce({
      id: 1, status: "UNDER_REVIEW", athleteId: 1, type: "Disclosure", title: "Test",
      description: null, dueDate: null, athleteNotes: null, reviewerNotes: null,
      reviewerId: null, submittedAt: null, reviewedAt: null, documentUrl: null,
      createdAt: new Date(), updatedAt: new Date(),
    } as any);

    const caller = appRouter.createCaller(makeCtx("admin"));
    await expect(
      caller.compliance.review({ id: 1, action: "approve", reviewerNotes: "Approved" })
    ).resolves.not.toThrow();
  });
});

// ─── Admin KPIs test ──────────────────────────────────────────────────────────

describe("admin analytics", () => {
  it("getDashboardStats returns KPI data for staff", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const stats = await caller.admin.getDashboardStats();
    expect(stats).toHaveProperty("totalAthletes");
    expect(stats).toHaveProperty("activeContracts");
    expect(stats).toHaveProperty("openOpportunities");
    expect(stats).toHaveProperty("pendingCompliance");
    expect(stats).toHaveProperty("totalContractValue");
    expect(stats).toHaveProperty("renewingSoon");
  });

  it("getDashboardStats is forbidden for athletes", async () => {
    const caller = appRouter.createCaller(makeCtx("athlete"));
    await expect(caller.admin.getDashboardStats()).rejects.toThrow("Staff access required");
  });

  it("getRecentActivity returns activity list for staff", async () => {
    const caller = appRouter.createCaller(makeCtx("agent"));
    const activity = await caller.admin.getRecentActivity();
    expect(Array.isArray(activity)).toBe(true);
  });
});

// ─── Athletes router tests ────────────────────────────────────────────────────

describe("athletes router", () => {
  it("staff can list all athletes", async () => {
    const caller = appRouter.createCaller(makeCtx("agent"));
    const athletes = await caller.athletes.list();
    expect(Array.isArray(athletes)).toBe(true);
  });

  it("athlete sees only their own profile", async () => {
    const mockDb = await import("./db");
    vi.mocked(mockDb.getAthleteByUserId).mockResolvedValueOnce({
      id: 1, firstName: "John", lastName: "Doe", sport: "Football",
      userId: 1, email: "john@test.com", phone: null, position: null,
      team: null, league: null, bio: null, photoUrl: null, nationality: null,
      city: null, state: null, country: null, instagramHandle: null,
      twitterHandle: null, representationStatus: "active", agentId: null,
      managerId: null, dateOfBirth: null, isActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    } as any);

    const caller = appRouter.createCaller(makeCtx("athlete", 1));
    const athletes = await caller.athletes.list();
    expect(athletes).toHaveLength(1);
  });

  it("athlete can submit a profile update request", async () => {
    const caller = appRouter.createCaller(makeCtx("athlete", 1));
    await expect(
      caller.athletes.submitUpdateRequest({
        athleteId: 1,
        fieldName: "email",
        requestedValue: "newemail@test.com",
        reason: "Email changed",
      })
    ).resolves.not.toThrow();
  });
});

// ─── Contract visibility test ─────────────────────────────────────────────────

describe("contract visibility", () => {
  it("admin notes are stripped for non-staff users", async () => {
    const mockDb = await import("./db");
    vi.mocked(mockDb.getContractById).mockResolvedValueOnce({
      id: 1, athleteId: 1, title: "Test Contract", counterparty: "Brand Co",
      contractType: "Endorsement", status: "Active", valueCents: 100000,
      startDate: null, endDate: null, signedDate: null, renewalDate: null,
      athleteNote: "Athlete note here", adminNote: "SECRET ADMIN NOTE",
      assignedAgentId: null, tags: null, documentUrl: null,
      createdAt: new Date(), updatedAt: new Date(),
    } as any);

    const caller = appRouter.createCaller(makeCtx("athlete"));
    const contract = await caller.contracts.getById({ id: 1 });
    expect(contract.adminNote).toBeUndefined();
    expect(contract.athleteNote).toBe("Athlete note here");
  });

  it("admin notes are visible to staff", async () => {
    const mockDb = await import("./db");
    vi.mocked(mockDb.getContractById).mockResolvedValueOnce({
      id: 1, athleteId: 1, title: "Test Contract", counterparty: "Brand Co",
      contractType: "Endorsement", status: "Active", valueCents: 100000,
      startDate: null, endDate: null, signedDate: null, renewalDate: null,
      athleteNote: "Athlete note here", adminNote: "SECRET ADMIN NOTE",
      assignedAgentId: null, tags: null, documentUrl: null,
      createdAt: new Date(), updatedAt: new Date(),
    } as any);

    const caller = appRouter.createCaller(makeCtx("agent"));
    const contract = await caller.contracts.getById({ id: 1 });
    expect(contract.adminNote).toBe("SECRET ADMIN NOTE");
  });
});

// ─── Opportunity types test ───────────────────────────────────────────────────

describe("opportunity types validation", () => {
  const validTypes = ["Career", "NIL", "Sponsorship", "Endorsement", "Event", "Media", "Speaking", "Community"];

  validTypes.forEach(type => {
    it(`accepts valid opportunity type: ${type}`, async () => {
      const caller = appRouter.createCaller(makeCtx("agent"));
      await expect(
        caller.opportunities.create({ athleteId: 1, title: "Test", type: type as any })
      ).resolves.not.toThrow();
    });
  });

  it("rejects invalid opportunity type", async () => {
    const caller = appRouter.createCaller(makeCtx("agent"));
    await expect(
      caller.opportunities.create({ athleteId: 1, title: "Test", type: "InvalidType" as any })
    ).rejects.toThrow();
  });
});

// ─── Compliance form types test ───────────────────────────────────────────────

describe("compliance form types validation", () => {
  const validTypes = [
    "Disclosure", "Medical Clearance", "Background Check",
    "Drug Testing Consent", "Financial Disclosure", "Travel Authorization", "Media Release"
  ];

  validTypes.forEach(type => {
    it(`accepts valid compliance type: ${type}`, async () => {
      const caller = appRouter.createCaller(makeCtx("admin"));
      await expect(
        caller.compliance.create({ athleteId: 1, title: "Test Form", type: type as any })
      ).resolves.not.toThrow();
    });
  });
});
