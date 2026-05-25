import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
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

function sanitizeTenant<T extends Record<string, unknown>>(tenant: T) {
  const {
    signalWireSpaceUrl: _signalWireSpaceUrl,
    docusignAccountId: _docusignAccountId,
    adobeSignAccountId: _adobeSignAccountId,
    ...safeTenant
  } = tenant;
  return safeTenant;
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
      representationStatus: z.enum(["active", "inactive", "pending", "prospective", "former"]).optional(),
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

// ─── Tenants / White Label Router ──────────────────────────────────────────

const tenantInput = z.object({
  name: z.string().min(1),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  status: z.enum(["onboarding", "active", "paused", "archived"]).optional(),
  brandColor: z.string().optional(),
  accentColor: z.string().optional(),
  logoUrl: z.string().optional(),
  heroImageUrl: z.string().optional(),
  publicDomain: z.string().optional(),
  portalDomain: z.string().optional(),
  googleWorkspaceDomain: z.string().optional(),
  signingProvider: z.enum(["manual", "docusign", "adobe_sign"]).optional(),
  docusignAccountId: z.string().optional(),
  adobeSignAccountId: z.string().optional(),
  googleCalendarId: z.string().optional(),
  zoomAccountEmail: z.string().optional(),
  leadCaptureSlug: z.string().optional(),
  intakeFormUrl: z.string().optional(),
  notes: z.string().optional(),
});

const tenantsRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      const tenants = await db.getAllTenants(input?.search);
      return tenants.map(tenant => sanitizeTenant(tenant as any));
    }),

  overview: protectedProcedure
    .input(z.object({ tenantId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      return db.getTenantOverview(input?.tenantId);
    }),

  create: protectedProcedure
    .input(tenantInput)
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user!.role);
      const tenant = await db.createTenant(input);
      await db.logActivity({ userId: ctx.user!.id, action: "Created tenant", entityType: "tenant", details: input.name });
      return sanitizeTenant(tenant as any);
    }),

  update: protectedProcedure
    .input(tenantInput.partial().extend({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user!.role);
      const { id, ...data } = input;
      const tenant = await db.updateTenant(id, data);
      return tenant ? sanitizeTenant(tenant as any) : tenant;
    }),

  members: protectedProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      return db.getTenantMembers(input.tenantId);
    }),
});

// ─── Athlete Pages / Media Router ──────────────────────────────────────────

const athletePagesRouter = router({
  list: protectedProcedure
    .input(z.object({ tenantId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      const pages = await db.getAllAthleteLandingPages(input?.tenantId);
      return pages.map(row => ({
        ...row,
        tenant: row.tenant ? sanitizeTenant(row.tenant as any) : row.tenant,
      }));
    }),

  publicBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ input }) => {
      const page = await db.getPublicAthletePage(input.slug);
      if (!page) throw new TRPCError({ code: "NOT_FOUND" });
      return {
        ...page,
        tenant: page.tenant ? sanitizeTenant(page.tenant as any) : page.tenant,
      };
    }),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      tenantId: z.number().default(1),
      athleteId: z.number(),
      slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
      headline: z.string().optional(),
      subheadline: z.string().optional(),
      coverImageUrl: z.string().optional(),
      videoUrl: z.string().optional(),
      statsJson: z.string().optional(),
      socialLinksJson: z.string().optional(),
      newsJson: z.string().optional(),
      isPublished: z.boolean().optional(),
      requiresPassword: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      return db.upsertAthleteLandingPage(input as any);
    }),

  media: protectedProcedure
    .input(z.object({
      athleteId: z.number().optional(),
      status: z.enum(["draft", "pending", "approved", "rejected", "archived"]).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const user = ctx.user!;
      if (STAFF_ROLES.includes(user.role as any)) {
        return db.getAthleteMediaAssets(input?.athleteId, input?.status);
      }
      const profile = await db.getAthleteByUserId(user.id);
      return db.getAthleteMediaAssets(profile?.id, input?.status);
    }),

  submitMedia: protectedProcedure
    .input(z.object({
      tenantId: z.number().default(1),
      athleteId: z.number().optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      assetType: z.enum(["image", "video", "story", "document"]),
      url: z.string().min(1),
      thumbnailUrl: z.string().optional(),
      visibility: z.enum(["public", "private"]).default("private"),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = input.athleteId ? undefined : await db.getAthleteByUserId(ctx.user!.id);
      const athleteId = input.athleteId ?? profile?.id;
      if (!athleteId) throw new TRPCError({ code: "BAD_REQUEST", message: "Athlete profile required" });
      const staffSubmitted = STAFF_ROLES.includes(ctx.user!.role as any);
      return db.createAthleteMediaAsset({
        ...input,
        athleteId,
        approvalStatus: staffSubmitted ? "approved" : "pending",
        submittedBy: ctx.user!.id,
      } as any);
    }),

  reviewMedia: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["approved", "rejected", "archived"]),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      return db.reviewAthleteMediaAsset(input.id, input.status, ctx.user!.id, input.note);
    }),
});

// ─── CRM / Lead Capture Router ─────────────────────────────────────────────

const crmLeadInput = z.object({
  tenantId: z.number().default(1),
  source: z.string().optional(),
  athleteFirstName: z.string().min(1),
  athleteLastName: z.string().min(1),
  athleteEmail: z.string().email().optional(),
  athletePhone: z.string().optional(),
  athleteSport: z.string().optional(),
  athleteGraduationYear: z.string().optional(),
  guardianName: z.string().optional(),
  guardianEmail: z.string().email().optional(),
  guardianPhone: z.string().optional(),
  school: z.string().optional(),
  notes: z.string().optional(),
});

const crmRouter = router({
  overview: protectedProcedure.query(async ({ ctx }) => {
    requireStaff(ctx.user!.role);
    return db.getTenantOverview();
  }),

  automationStatus: protectedProcedure.query(({ ctx }) => {
    requireStaff(ctx.user!.role);
    return {
      email: {
        status: "ready",
        mode: process.env.EMAIL_AUTOMATION_WEBHOOK_URL ? "provider-connected" : "queue-only",
      },
      sms: {
        status: "ready",
        mode: process.env.SMS_AUTOMATION_WEBHOOK_URL ? "provider-connected" : "queue-only",
      },
      calendar: {
        status: "ready",
        mode: "google-calendar-hand-off",
      },
      meetings: {
        status: "ready",
        mode: "zoom-or-google-meet-hand-off",
      },
    };
  }),

  listLeads: protectedProcedure
    .input(z.object({ status: z.enum(["new", "contacted", "meeting_scheduled", "post_call", "high_level_offer", "developmental_nurture", "closed_won", "closed_lost"]).optional() }).optional())
    .query(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      return db.getCrmLeads(input?.status);
    }),

  submitLead: publicProcedure
    .input(crmLeadInput)
    .mutation(async ({ input }) => {
      return db.createCrmLead({ ...input, source: input.source ?? "lead_magnet" } as any);
    }),

  createLead: protectedProcedure
    .input(crmLeadInput.extend({
      status: z.enum(["new", "contacted", "meeting_scheduled", "post_call", "high_level_offer", "developmental_nurture", "closed_won", "closed_lost"]).optional(),
      leadScore: z.number().optional(),
      nextStep: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      return db.createCrmLead(input as any);
    }),

  updateLead: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["new", "contacted", "meeting_scheduled", "post_call", "high_level_offer", "developmental_nurture", "closed_won", "closed_lost"]).optional(),
      leadScore: z.number().optional(),
      nextStep: z.string().optional(),
      notes: z.string().optional(),
      assignedToId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      const { id, ...data } = input;
      return db.updateCrmLead(id, data as any);
    }),

  listMeetings: protectedProcedure
    .input(z.object({ leadId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      return db.getLeadMeetings(input?.leadId);
    }),

  scheduleMeeting: protectedProcedure
    .input(z.object({
      tenantId: z.number().default(1),
      leadId: z.number(),
      status: z.string().default("proposed"),
      provider: z.enum(["zoom", "google_meet"]).default("zoom"),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      meetingUrl: z.string().optional(),
      calendarEventId: z.string().optional(),
      proposedSlotsJson: z.string().optional(),
      staffInviteesJson: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      const meeting = await db.createLeadMeeting({
        ...input,
        startTime: input.startTime ? new Date(input.startTime) : undefined,
        endTime: input.endTime ? new Date(input.endTime) : undefined,
      } as any);
      await db.updateCrmLead(input.leadId, { status: "meeting_scheduled", nextStep: "Meeting proposed or booked" } as any);
      return meeting;
    }),

  listFollowUps: protectedProcedure
    .input(z.object({ leadId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      return db.getLeadFollowUps(input?.leadId);
    }),

  triggerFollowUp: protectedProcedure
    .input(z.object({
      tenantId: z.number().default(1),
      leadId: z.number(),
      meetingId: z.number().optional(),
      path: z.enum(["general", "high_level", "developmental"]),
      channel: z.enum(["email", "sms"]).default("email"),
      subject: z.string().min(1),
      body: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaff(ctx.user!.role);
      const followUp = await db.createLeadFollowUp({ ...input, triggeredBy: ctx.user!.id } as any);
      const nextStatus = input.path === "high_level" ? "high_level_offer" : input.path === "developmental" ? "developmental_nurture" : "post_call";
      await db.updateCrmLead(input.leadId, { status: nextStatus as any, nextStep: `Follow-up queued via ${input.channel}` });
      return followUp;
    }),
});

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
  tenants: tenantsRouter,
  athletePages: athletePagesRouter,
  crm: crmRouter,
  admin: adminRouter,
  upload: uploadRouter,
});

export type AppRouter = typeof appRouter;
