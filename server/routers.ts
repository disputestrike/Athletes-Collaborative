import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";

// ─── Role helpers ─────────────────────────────────────────────────────────────

const STAFF_ROLES = ["owner", "admin", "agent", "manager", "marketing_coordinator", "compliance_reviewer"] as const;
const ADMIN_ROLES = ["owner", "admin"] as const;

function requireStaff(role: string) {
  if (!STAFF_ROLES.includes(role as any)) throw new TRPCError({ code: "FORBIDDEN", message: "Staff access required" });
}
function requireAdmin(role: string) {
  if (!ADMIN_ROLES.includes(role as any)) throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
}

// ─── Auth Router ──────────────────────────────────────────────────────────────

const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});

// ─── Athletes Router ──────────────────────────────────────────────────────────

const athletesRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const user = ctx.user!;
      if (STAFF_ROLES.includes(user.role as any)) {
        return db.getAllAthletes(input?.search);
      }
      // Athletes see only their own profile
      const profile = await db.getAthleteByUserId(user.id);
      return profile ? [profile] : [];
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const athlete = await db.getAthleteById(input.id);
      if (!athlete) throw new TRPCError({ code: "NOT_FOUND" });
      return athlete;
    }),

  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    return db.getAthleteByUserId(ctx.user!.id);
  }),

  getKPIs: protectedProcedure
    .input(z.object({ athleteId: z.number() }))
    .query(async ({ ctx, input }) => {
      return db.getAthleteKPIs(input.athleteId);
    }),

  create: protectedProcedure
    .input(z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      sport: z.string().min(1),
      phone: z.string().optional(),
      position: z.string().optional(),
      team: z.string().optional(),
      league: z.string().optional(),
      bio: z.string().optional(),
      nationality: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      agentId: z.number().optional(),
      managerId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      await db.createAthlete(input);
      await db.logActivity({ userId: ctx.user!.id, action: "Created athlete", entityType: "athlete", details: `${input.firstName} ${input.lastName}` });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      sport: z.string().optional(),
      phone: z.string().optional(),
      position: z.string().optional(),
      team: z.string().optional(),
      league: z.string().optional(),
      bio: z.string().optional(),
      photoUrl: z.string().optional(),
      nationality: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      instagramHandle: z.string().optional(),
      twitterHandle: z.string().optional(),
      representationStatus: z.enum(["active", "inactive", "pending", "former"]).optional(),
      agentId: z.number().optional(),
      managerId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      const { id, ...data } = input;
      await db.updateAthlete(id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user!.role);
      await db.deleteAthlete(input.id);
    }),

  // Team members
  getTeamMembers: protectedProcedure
    .input(z.object({ athleteId: z.number() }))
    .query(({ input }) => db.getTeamMembersByAthlete(input.athleteId)),

  addTeamMember: protectedProcedure
    .input(z.object({
      athleteId: z.number(),
      name: z.string().min(1),
      role: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      isPrimary: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      await db.createTeamMember(input);
    }),

  removeTeamMember: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      await db.deleteTeamMember(input.id);
    }),

  // Family members
  getFamilyMembers: protectedProcedure
    .input(z.object({ athleteId: z.number() }))
    .query(({ input }) => db.getFamilyMembersByAthlete(input.athleteId)),

  addFamilyMember: protectedProcedure
    .input(z.object({
      athleteId: z.number(),
      name: z.string().min(1),
      relationship: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      canViewContracts: z.boolean().optional(),
      canViewFinancials: z.boolean().optional(),
      canMessage: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      await db.createFamilyMember(input);
    }),

  removeFamilyMember: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      await db.deleteFamilyMember(input.id);
    }),

  // Profile update requests
  submitUpdateRequest: protectedProcedure
    .input(z.object({
      athleteId: z.number(),
      fieldName: z.string(),
      currentValue: z.string().optional(),
      requestedValue: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.createProfileUpdateRequest({ ...input, requestedBy: ctx.user!.id });
    }),

  getPendingRequests: protectedProcedure
    .input(z.object({ athleteId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      return db.getPendingUpdateRequests(input?.athleteId);
    }),

  reviewUpdateRequest: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["approved", "rejected"]),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      await db.reviewUpdateRequest(input.id, input.status, ctx.user!.id, input.note);
    }),
});

// ─── Contracts Router ─────────────────────────────────────────────────────────

const contractsRouter = router({
  list: protectedProcedure
    .input(z.object({ athleteId: z.number().optional(), search: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const user = ctx.user!;
      if (input?.athleteId) return db.getContractsByAthlete(input.athleteId);
      if (STAFF_ROLES.includes(user.role as any)) return db.getAllContracts(input?.search);
      const profile = await db.getAthleteByUserId(user.id);
      if (!profile) return [];
      return db.getContractsByAthlete(profile.id);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const contract = await db.getContractById(input.id);
      if (!contract) throw new TRPCError({ code: "NOT_FOUND" });
      // Strip admin-only notes for non-staff
      const user = ctx.user!;
      if (!STAFF_ROLES.includes(user.role as any)) {
        return { ...contract, adminNote: undefined };
      }
      return contract;
    }),

  create: protectedProcedure
    .input(z.object({
      athleteId: z.number(),
      title: z.string().min(1),
      counterparty: z.string().optional(),
      contractType: z.string().optional(),
      status: z.enum(["Draft", "Active", "Expired", "Terminated"]).optional(),
      valueCents: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      signedDate: z.string().optional(),
      renewalDate: z.string().optional(),
      athleteNote: z.string().optional(),
      adminNote: z.string().optional(),
      internalNote: z.string().optional(),
      assignedAgentId: z.number().optional(),
      tags: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      const { internalNote, ...rest } = input;
      await db.createContract({ ...rest, adminNote: internalNote ?? rest.adminNote } as any);
      await db.logActivity({ userId: ctx.user!.id, action: "Created contract", entityType: "contract", details: input.title });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      counterparty: z.string().optional(),
      contractType: z.string().optional(),
      status: z.enum(["Draft", "Active", "Expired", "Terminated"]).optional(),
      valueCents: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      signedDate: z.string().optional(),
      renewalDate: z.string().optional(),
      athleteNote: z.string().optional(),
      adminNote: z.string().optional(),
      internalNote: z.string().optional(),
      assignedAgentId: z.number().optional(),
      tags: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      const { id, internalNote, ...data } = input;
      await db.updateContract(id, { ...data, adminNote: internalNote ?? data.adminNote } as any);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user!.role);
      await db.deleteContract(input.id);
    }),
});

// ─── Opportunities Router ─────────────────────────────────────────────────────

const opportunitiesRouter = router({
  list: protectedProcedure
    .input(z.object({ athleteId: z.number().optional(), search: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const user = ctx.user!;
      if (input?.athleteId) return db.getOpportunitiesByAthlete(input.athleteId);
      if (STAFF_ROLES.includes(user.role as any)) return db.getAllOpportunities(input?.search);
      const profile = await db.getAthleteByUserId(user.id);
      if (!profile) return [];
      return db.getOpportunitiesByAthlete(profile.id);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const opp = await db.getOpportunityById(input.id);
      if (!opp) throw new TRPCError({ code: "NOT_FOUND" });
      return opp;
    }),

  create: protectedProcedure
    .input(z.object({
      athleteId: z.number(),
      title: z.string().min(1),
      type: z.enum(["Career", "NIL", "Sponsorship", "Endorsement", "Event", "Media", "Speaking", "Community"]),
      status: z.enum(["Identified", "Contacted", "In Negotiation", "Offer Received", "Accepted", "Declined", "Converted", "Lost"]).optional(),
      description: z.string().optional(),
      organization: z.string().optional(),
      deadline: z.string().optional(),
      valueCents: z.number().optional(),
      assignedToId: z.number().optional(),
      notes: z.string().optional(),
      internalNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      await db.createOpportunity(input as any);
      await db.logActivity({ userId: ctx.user!.id, action: "Created opportunity", entityType: "opportunity", details: input.title });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      type: z.enum(["Career", "NIL", "Sponsorship", "Endorsement", "Event", "Media", "Speaking", "Community"]).optional(),
      status: z.enum(["Identified", "Contacted", "In Negotiation", "Offer Received", "Accepted", "Declined", "Converted", "Lost"]).optional(),
      description: z.string().optional(),
      organization: z.string().optional(),
      deadline: z.string().optional(),
      valueCents: z.number().optional(),
      assignedToId: z.number().optional(),
      notes: z.string().optional(),
      internalNotes: z.string().optional(),
      convertedToContractId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      const { id, ...data } = input;
      await db.updateOpportunity(id, data as any);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user!.role);
      await db.deleteOpportunity(input.id);
    }),

  aiMatch: protectedProcedure
    .input(z.object({ athleteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      const athlete = await db.getAthleteById(input.athleteId);
      if (!athlete) throw new TRPCError({ code: "NOT_FOUND" });
      const opportunities = await db.getOpportunitiesByAthlete(input.athleteId);
      const prompt = `You are an AI sports career advisor. Given athlete ${athlete.firstName} ${athlete.lastName} who plays ${athlete.sport}, analyze their ${opportunities.length} opportunities and suggest which 3 are highest priority. Return JSON with array of {id, score, reason}.`;
      const response = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
      return response.choices[0]?.message?.content ?? "No recommendations available";
    }),
});

// ─── Campaigns Router ─────────────────────────────────────────────────────────

const campaignsRouter = router({
  list: protectedProcedure
    .input(z.object({ athleteId: z.number().optional(), search: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const user = ctx.user!;
      if (input?.athleteId) return db.getCampaignsByAthlete(input.athleteId);
      if (STAFF_ROLES.includes(user.role as any)) return db.getAllCampaigns(input?.search);
      const profile = await db.getAthleteByUserId(user.id);
      if (!profile) return [];
      return db.getCampaignsByAthlete(profile.id);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const c = await db.getCampaignById(input.id);
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });
      return c;
    }),

  getAthletes: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(({ input }) => db.getCampaignAthletes(input.campaignId)),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      brand: z.string().optional(),
      status: z.enum(["Planning", "Active", "Paused", "Completed", "Cancelled"]).optional(),
      description: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      budgetCents: z.number().optional(),
      managerId: z.number().optional(),
      deliverables: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      await db.createCampaign(input as any);
      await db.logActivity({ userId: ctx.user!.id, action: "Created campaign", entityType: "campaign", details: input.name });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      brand: z.string().optional(),
      status: z.enum(["Planning", "Active", "Paused", "Completed", "Cancelled"]).optional(),
      description: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      budgetCents: z.number().optional(),
      deliverables: z.string().optional(),
      performanceNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      const { id, ...data } = input;
      await db.updateCampaign(id, data as any);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user!.role);
      await db.deleteCampaign(input.id);
    }),

  addAthlete: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      athleteId: z.number(),
      role: z.string().optional(),
      feeCents: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      await db.addAthleteToCampaign(input);
    }),
});

// ─── Compliance Router ────────────────────────────────────────────────────────

const complianceRouter = router({
  list: protectedProcedure
    .input(z.object({ athleteId: z.number().optional(), search: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const user = ctx.user!;
      if (input?.athleteId) return db.getComplianceByAthlete(input.athleteId);
      if (STAFF_ROLES.includes(user.role as any)) return db.getAllCompliance(input?.search);
      const profile = await db.getAthleteByUserId(user.id);
      if (!profile) return [];
      return db.getComplianceByAthlete(profile.id);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const form = await db.getComplianceById(input.id);
      if (!form) throw new TRPCError({ code: "NOT_FOUND" });
      return form;
    }),

  create: protectedProcedure
    .input(z.object({
      athleteId: z.number(),
      type: z.enum(["Disclosure", "Medical Clearance", "Background Check", "Drug Testing Consent", "Financial Disclosure", "Travel Authorization", "Media Release"]),
      title: z.string().min(1),
      description: z.string().optional(),
      dueDate: z.string().optional(),
      reviewerId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      await db.createComplianceForm(input as any);
      await db.logActivity({ userId: ctx.user!.id, action: "Created compliance form", entityType: "compliance", details: input.title });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      dueDate: z.string().optional(),
      athleteNotes: z.string().optional(),
      reviewerNotes: z.string().optional(),
      reviewerId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateComplianceForm(id, data as any);
    }),

  // State machine transitions
  submit: protectedProcedure
    .input(z.object({ id: z.number(), athleteNotes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const form = await db.getComplianceById(input.id);
      if (!form) throw new TRPCError({ code: "NOT_FOUND" });
      if (form.status !== "DRAFT") throw new TRPCError({ code: "BAD_REQUEST", message: "Only DRAFT forms can be submitted" });
      await db.updateComplianceForm(input.id, { status: "SUBMITTED", submittedAt: new Date(), athleteNotes: input.athleteNotes ?? form.athleteNotes } as any);
      await db.logActivity({ userId: ctx.user!.id, action: "Submitted compliance form", entityType: "compliance", entityId: input.id });
    }),

  startReview: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      const form = await db.getComplianceById(input.id);
      if (!form) throw new TRPCError({ code: "NOT_FOUND" });
      if (form.status !== "SUBMITTED") throw new TRPCError({ code: "BAD_REQUEST", message: "Only SUBMITTED forms can be reviewed" });
      await db.updateComplianceForm(input.id, { status: "UNDER_REVIEW" } as any);
    }),

  approve: protectedProcedure
    .input(z.object({ id: z.number(), reviewerNotes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      const form = await db.getComplianceById(input.id);
      if (!form) throw new TRPCError({ code: "NOT_FOUND" });
      if (form.status !== "UNDER_REVIEW") throw new TRPCError({ code: "BAD_REQUEST", message: "Only UNDER_REVIEW forms can be approved" });
      await db.updateComplianceForm(input.id, { status: "APPROVED", reviewedAt: new Date(), reviewerNotes: input.reviewerNotes ?? null, reviewerId: ctx.user!.id } as any);
      await db.logActivity({ userId: ctx.user!.id, action: "Approved compliance form", entityType: "compliance", entityId: input.id });
    }),

  reject: protectedProcedure
    .input(z.object({ id: z.number(), reviewerNotes: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      const form = await db.getComplianceById(input.id);
      if (!form) throw new TRPCError({ code: "NOT_FOUND" });
      if (form.status !== "UNDER_REVIEW") throw new TRPCError({ code: "BAD_REQUEST", message: "Only UNDER_REVIEW forms can be rejected" });
      await db.updateComplianceForm(input.id, { status: "REJECTED", reviewedAt: new Date(), reviewerNotes: input.reviewerNotes, reviewerId: ctx.user!.id } as any);
    }),

  // Combined review action (used by AdminCompliance UI)
  review: protectedProcedure
    .input(z.object({
      id: z.number(),
      action: z.enum(["approve", "reject"]),
      reviewerNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      const form = await db.getComplianceById(input.id);
      if (!form) throw new TRPCError({ code: "NOT_FOUND" });
      if (input.action === "approve") {
        await db.updateComplianceForm(input.id, { status: "APPROVED", reviewedAt: new Date(), reviewerNotes: input.reviewerNotes ?? null, reviewerId: ctx.user!.id } as any);
        await db.logActivity({ userId: ctx.user!.id, action: "Approved compliance form", entityType: "compliance", entityId: input.id });
      } else {
        await db.updateComplianceForm(input.id, { status: "REJECTED", reviewedAt: new Date(), reviewerNotes: input.reviewerNotes ?? null, reviewerId: ctx.user!.id } as any);
        await db.logActivity({ userId: ctx.user!.id, action: "Rejected compliance form", entityType: "compliance", entityId: input.id });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user!.role);
      await db.deleteComplianceForm(input.id);
    }),
});

// ─── Messages Router ──────────────────────────────────────────────────────────

const messagesRouter = router({
  getThreads: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user!;
    if (STAFF_ROLES.includes(user.role as any)) return db.getAllThreads();
    return db.getThreadsForUser(user.id);
  }),

  getMessages: protectedProcedure
    .input(z.object({ threadId: z.number() }))
    .query(({ input }) => db.getMessagesByThread(input.threadId)),

  createThread: protectedProcedure
    .input(z.object({
      subject: z.string().min(1),
      athleteId: z.number().optional(),
      participantIds: z.array(z.number()),
      firstMessage: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const threadResult = await db.createThread({
        subject: input.subject,
        athleteId: input.athleteId ?? null,
        createdBy: ctx.user!.id,
      });
      // Get the inserted thread id
      const threads = await db.getAllThreads();
      const thread = threads[0];
      if (!thread) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Add participants
      const allParticipants = Array.from(new Set([ctx.user!.id, ...input.participantIds]));
      for (const uid of allParticipants) {
        await db.addThreadParticipant(thread.id, uid);
      }
      // Send first message
      await db.sendMessage({ threadId: thread.id, senderId: ctx.user!.id, body: input.firstMessage });
      return thread;
    }),

  sendMessage: protectedProcedure
    .input(z.object({
      threadId: z.number(),
      body: z.string().min(1),
      attachmentUrl: z.string().optional(),
      attachmentName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.sendMessage({ ...input, senderId: ctx.user!.id });
    }),

  markRead: protectedProcedure
    .input(z.object({ threadId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.markThreadRead(input.threadId, ctx.user!.id);
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return db.getUnreadCount(ctx.user!.id);
  }),
});

// ─── Growth Router ────────────────────────────────────────────────────────────

const growthRouter = router({
  getMaterials: protectedProcedure.query(() => db.getAllMaterials()),
  createMaterial: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      category: z.string().min(1),
      type: z.enum(["Article", "Video", "Course", "Webinar", "Podcast", "E-Book", "Guide"]),
      description: z.string().optional(),
      url: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      isFeatured: z.boolean().optional(),
      sport: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      await db.createMaterial(input);
    }),
  updateMaterial: protectedProcedure
    .input(z.object({ id: z.number(), title: z.string().optional(), category: z.string().optional(), description: z.string().optional(), url: z.string().optional(), isFeatured: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      const { id, ...data } = input;
      await db.updateMaterial(id, data);
    }),
  deleteMaterial: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user!.role);
      await db.deleteMaterial(input.id);
    }),

  getPartners: protectedProcedure.query(() => db.getAllPartners()),
  createPartner: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      category: z.enum(["Financial Planning", "Tax", "Legal", "Insurance", "Real Estate", "Investment", "Banking", "Other"]),
      description: z.string().optional(),
      website: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      isFeatured: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      await db.createPartner(input);
    }),
  updatePartner: protectedProcedure
    .input(z.object({ id: z.number(), name: z.string().optional(), description: z.string().optional(), website: z.string().optional(), isFeatured: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      const { id, ...data } = input;
      await db.updatePartner(id, data);
    }),
  deletePartner: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user!.role);
      await db.deletePartner(input.id);
    }),

  getOutreach: protectedProcedure.query(() => db.getAllOutreach()),
  createOutreach: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      type: z.enum(["Youth Program", "Charity Event", "Mentorship", "Workshop", "Community Service", "Scholarship", "Other"]),
      description: z.string().optional(),
      status: z.enum(["Upcoming", "Active", "Completed", "Cancelled"]).optional(),
      date: z.string().optional(),
      location: z.string().optional(),
      isFeatured: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      await db.createOutreach(input as any);
    }),
  updateOutreach: protectedProcedure
    .input(z.object({ id: z.number(), title: z.string().optional(), status: z.enum(["Upcoming", "Active", "Completed", "Cancelled"]).optional(), description: z.string().optional(), isFeatured: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      const { id, ...data } = input;
      await db.updateOutreach(id, data as any);
    }),
  deleteOutreach: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user!.role);
      await db.deleteOutreach(input.id);
    }),
});

// ─── Admin Router ─────────────────────────────────────────────────────────────

const adminRouter = router({
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    requireStaff(ctx.user!.role);
    return db.getAdminKPIsWithRenewal();
  }),

  getRecentActivity: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      return db.getRecentActivity(input?.limit ?? 20);
    }),

  getPendingReviews: protectedProcedure.query(async ({ ctx }) => {
    requireStaff(ctx.user!.role);
    return db.getAllCompliance();
  }),

  getRevenueData: protectedProcedure.query(async ({ ctx }) => {
    requireStaff(ctx.user!.role);
    return db.getRevenueData();
  }),

  getAthletes: protectedProcedure.query(async ({ ctx }) => {
    requireStaff(ctx.user!.role);
    return db.getAllAthletes();
  }),

  getAthleteById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      return db.getAthleteById(input.id);
    }),

  createAthlete: protectedProcedure
    .input(z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().optional(),
      phone: z.string().optional(),
      sport: z.string().optional(),
      position: z.string().optional(),
      team: z.string().optional(),
      league: z.string().optional(),
      bio: z.string().optional(),
      nationality: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      instagramHandle: z.string().optional(),
      twitterHandle: z.string().optional(),
      representationStatus: z.string().optional(),
      dateOfBirth: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      await db.createAthlete(input as any);
      await db.logActivity({ userId: ctx.user!.id, action: "Created athlete", entityType: "athlete", details: `${input.firstName} ${input.lastName}` });
    }),

  updateAthlete: protectedProcedure
    .input(z.object({
      id: z.number(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      sport: z.string().optional(),
      position: z.string().optional(),
      team: z.string().optional(),
      league: z.string().optional(),
      bio: z.string().optional(),
      nationality: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      instagramHandle: z.string().optional(),
      twitterHandle: z.string().optional(),
      representationStatus: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      const { id, ...data } = input;
      await db.updateAthlete(id, data as any);
    }),

  getUpdateRequests: protectedProcedure
    .input(z.object({ athleteId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      return db.getPendingUpdateRequests(input?.athleteId);
    }),

  approveUpdateRequest: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      await db.reviewUpdateRequest(input.id, "approved", ctx.user!.id);
    }),

  rejectUpdateRequest: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      await db.reviewUpdateRequest(input.id, "rejected", ctx.user!.id);
    }),

  getKPIs: protectedProcedure.query(async ({ ctx }) => {
    requireStaff(ctx.user!.role);
    return db.getAdminKPIs();
  }),


  getSportDistribution: protectedProcedure.query(async ({ ctx }) => {
    requireStaff(ctx.user!.role);
    return db.getSportDistribution();
  }),

  getActivity: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      return db.getRecentActivity(input?.limit ?? 20);
    }),

  getUsers: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user!.role);
    return db.getAllUsers();
  }),

  updateUserRole: protectedProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["owner", "admin", "agent", "manager", "marketing_coordinator", "compliance_reviewer", "athlete", "family_member", "external_partner"]),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user!.role);
      await db.updateUserRole(input.userId, input.role);
    }),

  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    return db.getNotificationsForUser(ctx.user!.id);
  }),

  markNotificationRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.markNotificationRead(input.id);
    }),
});

// ─── File Upload Router ───────────────────────────────────────────────────────

const uploadRouter = router({
  getUploadUrl: protectedProcedure
    .input(z.object({
      filename: z.string(),
      contentType: z.string(),
      folder: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Return a presigned-style key for client to use
      const key = `${input.folder ?? "uploads"}/${ctx.user!.id}/${Date.now()}-${input.filename}`;
      return { key };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  athletes: athletesRouter,
  contracts: contractsRouter,
  opportunities: opportunitiesRouter,
  campaigns: campaignsRouter,
  compliance: complianceRouter,
  messages: messagesRouter,
  growth: growthRouter,
  admin: adminRouter,
  upload: uploadRouter,
});

export type AppRouter = typeof appRouter;
