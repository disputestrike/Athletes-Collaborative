import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const client = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(client);

const {
  athleteLandingPages,
  athleteMediaAssets,
  athleteProfiles,
  businessPartners,
  careerOpportunities,
  communityOutreach,
  complianceForms,
  contracts,
  crmLeads,
  educationalMaterials,
  leadFollowUps,
  leadMeetings,
  marketingCampaigns,
  tenants,
} = await import("../drizzle/schema.ts");

console.log("Seeding Athletes Collaborative PostgreSQL database...");

const [tenant] = await db
  .insert(tenants)
  .values({
    name: "Athletes Collaborative",
    slug: "athletes-collaborative",
    status: "active",
    brandColor: "#F97316",
    accentColor: "#111827",
    heroImageUrl:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80",
    signingProvider: "manual",
    leadCaptureSlug: "athletes-collaborative",
    notes: "Parent tenant for the standalone platform.",
  })
  .returning({ id: tenants.id });

const insertedAthletes = await db
  .insert(athleteProfiles)
  .values([
    {
      tenantId: tenant.id,
      firstName: "Marcus",
      lastName: "Johnson",
      sport: "Basketball",
      position: "Point Guard",
      team: "Duke University",
      bio: "Elite point guard with exceptional court vision and leadership skills.",
      representationStatus: "active",
      email: "marcus.johnson@example.com",
      phone: "404-555-0101",
      city: "Atlanta",
      state: "GA",
      instagramHandle: "@marcusjhoops",
      twitterHandle: "@MarcusJ_PG",
    },
    {
      tenantId: tenant.id,
      firstName: "Aaliyah",
      lastName: "Williams",
      sport: "Soccer",
      position: "Forward",
      team: "UCLA",
      bio: "Dynamic forward with a strong NIL portfolio.",
      representationStatus: "active",
      email: "aaliyah.williams@example.com",
      phone: "713-555-0202",
      city: "Houston",
      state: "TX",
      instagramHandle: "@aaliyahgoals",
      twitterHandle: "@AaliyahW_Soccer",
    },
    {
      tenantId: tenant.id,
      firstName: "Darius",
      lastName: "Thompson",
      sport: "Football",
      position: "Wide Receiver",
      team: "Alabama",
      bio: "Explosive wide receiver with first-round potential.",
      representationStatus: "active",
      email: "darius.thompson@example.com",
      phone: "305-555-0303",
      city: "Miami",
      state: "FL",
      instagramHandle: "@dariusthompsonwr",
      twitterHandle: "@DariusT_WR",
    },
  ])
  .returning({ id: athleteProfiles.id });

const [marcus, aaliyah, darius] = insertedAthletes;

if (marcus) {
  await db.insert(contracts).values({
    athleteId: marcus.id,
    title: "Nike Basketball Endorsement",
    counterparty: "Nike, Inc.",
    contractType: "Endorsement",
    status: "Active",
    valueCents: 25000000,
    startDate: new Date("2024-09-01"),
    endDate: new Date("2026-08-31"),
    athleteNote: "Includes appearance requirements and signature colorways.",
    tags: "NIL,Priority,Renewal",
  });

  await db.insert(athleteLandingPages).values({
    tenantId: tenant.id,
    athleteId: marcus.id,
    slug: "marcus-johnson",
    headline: "Marcus Johnson",
    subheadline:
      "Elite point guard with public stats, approved media, news, and social links in one shareable profile.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80",
    statsJson: JSON.stringify([
      { label: "PPG", value: "18.4" },
      { label: "APG", value: "7.2" },
      { label: "GPA", value: "3.8" },
    ]),
    socialLinksJson: JSON.stringify([
      { label: "Instagram", url: "https://instagram.com/marcusjhoops" },
      { label: "X", url: "https://x.com/MarcusJ_PG" },
    ]),
    newsJson: JSON.stringify([
      {
        title: "Regional showcase invite",
        date: "2026-04-20",
        summary: "Marcus was selected for a summer regional prospect showcase.",
      },
    ]),
    isPublished: true,
  });

  await db.insert(athleteMediaAssets).values([
    {
      tenantId: tenant.id,
      athleteId: marcus.id,
      title: "Showcase action photo",
      description: "Approved public media for the landing page.",
      assetType: "image",
      url: "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1200&q=80",
      visibility: "public",
      approvalStatus: "approved",
    },
    {
      tenantId: tenant.id,
      athleteId: marcus.id,
      title: "Training clip",
      description: "Athlete-submitted media waiting for review.",
      assetType: "video",
      url: "https://example.com/training-clip.mp4",
      visibility: "private",
      approvalStatus: "pending",
    },
  ]);
}

if (aaliyah) {
  await db.insert(careerOpportunities).values({
    athleteId: aaliyah.id,
    title: "Gatorade NIL Partnership",
    type: "NIL",
    status: "In Negotiation",
    organization: "Gatorade",
    valueCents: 8500000,
    deadline: new Date("2026-07-31"),
    description: "Social campaign and hydration education partnership.",
    notes: "Reviewing deliverables and usage rights.",
  });
}

if (darius) {
  await db.insert(complianceForms).values({
    athleteId: darius.id,
    title: "Draft Background Check",
    type: "Background Check",
    status: "UNDER_REVIEW",
    description: "Pre-draft background verification.",
    dueDate: new Date("2026-02-28"),
  });
}

await db.insert(marketingCampaigns).values({
  name: "Rise Campaign",
  brand: "Nike",
  status: "Planning",
  budgetCents: 50000000,
  startDate: new Date("2026-01-01"),
  endDate: new Date("2026-12-31"),
  description: "Multi-athlete brand campaign.",
  deliverables: "Social posts, video shoot, and community activation",
});

await db.insert(educationalMaterials).values({
  title: "NIL 101",
  category: "NIL Education",
  type: "Guide",
  description: "A practical guide to NIL rules, rights, and earning potential.",
  isFeatured: true,
});

await db.insert(businessPartners).values({
  name: "Morgan Stanley Sports Finance",
  category: "Financial Planning",
  description: "Financial planning and wealth management for athletes.",
  website: "https://morganstanley.com",
  contactEmail: "sports@morganstanley.com",
  isFeatured: true,
});

await db.insert(communityOutreach).values({
  title: "Youth Basketball Clinic",
  type: "Youth Program",
  status: "Upcoming",
  date: new Date("2026-06-20"),
  location: "Atlanta, GA",
  description: "Free basketball clinic for youth athletes.",
  isFeatured: true,
});

const [lead] = await db
  .insert(crmLeads)
  .values({
    tenantId: tenant.id,
    source: "SMS lead magnet",
    status: "meeting_scheduled",
    athleteFirstName: "Avery",
    athleteLastName: "Williams",
    athleteEmail: "avery@example.com",
    athletePhone: "555-010-1440",
    athleteSport: "Soccer",
    athleteGraduationYear: "2027",
    guardianName: "Dana Williams",
    guardianEmail: "dana@example.com",
    guardianPhone: "555-010-1441",
    school: "Northside Academy",
    notes: "Interested in family onboarding and NIL education.",
    leadScore: 84,
    nextStep: "Confirm family call and send prep material.",
  })
  .returning({ id: crmLeads.id });

const [meeting] = await db
  .insert(leadMeetings)
  .values({
    tenantId: tenant.id,
    leadId: lead.id,
    status: "scheduled",
    provider: "zoom",
    startTime: new Date("2026-05-27T20:00:00.000Z"),
    endTime: new Date("2026-05-27T20:30:00.000Z"),
    meetingUrl: "https://zoom.us/j/placeholder",
    staffInviteesJson: JSON.stringify(["staff@athletescollaborative.com"]),
  })
  .returning({ id: leadMeetings.id });

await db.insert(leadFollowUps).values({
  tenantId: tenant.id,
  leadId: lead.id,
  meetingId: meeting.id,
  path: "high_level",
  subject: "Next steps with Athletes Collaborative",
  body: "Thank you for meeting with us. Here are the next steps, FAQs, and materials for families reviewing representation.",
});

await client.end();
console.log("Seed complete.");
