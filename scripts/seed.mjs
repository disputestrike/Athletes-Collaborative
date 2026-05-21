import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Import schema tables
const { 
  athleteProfiles, contracts, careerOpportunities, marketingCampaigns,
  complianceForms, educationalMaterials, businessPartners, communityOutreach
} = await import("../drizzle/schema.ts");

console.log("🌱 Seeding Athletes Collaborative database...");

// ─── Athletes ────────────────────────────────────────────────────────────────
const athletes = [
  { firstName: "Marcus", lastName: "Johnson", sport: "Basketball", position: "Point Guard", school: "Duke University", graduationYear: 2025, hometown: "Atlanta, GA", bio: "Elite point guard with exceptional court vision and leadership skills. Two-time All-American.", representationStatus: "active", email: "marcus.johnson@example.com", phone: "404-555-0101", instagramHandle: "@marcusjhoops", twitterHandle: "@MarcusJ_PG", height: "6'2\"", weight: "185 lbs", gpa: "3.7" },
  { firstName: "Aaliyah", lastName: "Williams", sport: "Soccer", position: "Forward", school: "UCLA", graduationYear: 2024, hometown: "Houston, TX", bio: "Dynamic forward with 34 career goals. NWSL Draft prospect and NIL pioneer.", representationStatus: "active", email: "aaliyah.williams@example.com", phone: "713-555-0202", instagramHandle: "@aaliyahgoals", twitterHandle: "@AaliyahW_Soccer", height: "5'7\"", weight: "140 lbs", gpa: "3.5" },
  { firstName: "Darius", lastName: "Thompson", sport: "Football", position: "Wide Receiver", school: "Alabama", graduationYear: 2025, hometown: "Miami, FL", bio: "Explosive wide receiver with 4.38 speed. Top-10 NFL Draft projection.", representationStatus: "active", email: "darius.thompson@example.com", phone: "305-555-0303", instagramHandle: "@dariusthompsonwr", twitterHandle: "@DariusT_WR", height: "6'1\"", weight: "195 lbs", gpa: "3.2" },
  { firstName: "Sofia", lastName: "Martinez", sport: "Tennis", position: "Singles / Doubles", school: "Stanford", graduationYear: 2026, hometown: "San Diego, CA", bio: "Ranked #3 collegiate tennis player. WTA Tour aspirant with strong baseline game.", representationStatus: "active", email: "sofia.martinez@example.com", phone: "619-555-0404", instagramHandle: "@sofiamrtennis", twitterHandle: "@SofiaM_Tennis", height: "5'9\"", weight: "135 lbs", gpa: "3.9" },
  { firstName: "Elijah", lastName: "Brooks", sport: "Baseball", position: "Pitcher", school: "Vanderbilt", graduationYear: 2025, hometown: "Nashville, TN", bio: "Power pitcher averaging 97 mph fastball. Top-5 MLB Draft prospect.", representationStatus: "active", email: "elijah.brooks@example.com", phone: "615-555-0505", instagramHandle: "@elijahbrookspitch", twitterHandle: "@ElijahB_Pitcher", height: "6'4\"", weight: "215 lbs", gpa: "3.4" },
  { firstName: "Priya", lastName: "Patel", sport: "Triathlon", position: "Olympic Distance", school: "University of Colorado", graduationYear: 2024, hometown: "Boulder, CO", bio: "National collegiate triathlon champion. Olympic team hopeful for 2028 Games.", representationStatus: "active", email: "priya.patel@example.com", phone: "303-555-0606", instagramHandle: "@priyatri", twitterHandle: "@PriyaP_Tri", height: "5'6\"", weight: "128 lbs", gpa: "3.8" },
];

console.log("  → Inserting athletes...");
const insertedAthletes = [];
for (const athlete of athletes) {
  await db.insert(athleteProfiles).values(athlete).onDuplicateKeyUpdate({ set: { firstName: athlete.firstName } });
  const [rows] = await connection.execute("SELECT id FROM athlete_profiles WHERE firstName = ? AND lastName = ? LIMIT 1", [athlete.firstName, athlete.lastName]);
  insertedAthletes.push(rows[0]);
}
console.log(`  ✓ ${insertedAthletes.length} athletes inserted`);

// ─── Contracts ───────────────────────────────────────────────────────────────
const contractData = [
  { athleteId: insertedAthletes[0]?.id, title: "Nike Basketball Endorsement", counterparty: "Nike, Inc.", contractType: "Endorsement", status: "Active", valueCents: 25000000, startDate: new Date("2024-09-01"), endDate: new Date("2026-08-31"), athleteNote: "Includes 2 signature shoe colorways per year. Appearance requirements: 4 events annually.", tags: "NIL,Priority,Renewal" },
  { athleteId: insertedAthletes[1]?.id, title: "Gatorade NIL Partnership", counterparty: "Gatorade / PepsiCo", contractType: "NIL", status: "Active", valueCents: 8500000, startDate: new Date("2024-08-01"), endDate: new Date("2025-07-31"), athleteNote: "Social media posts: 2 per month. Product usage at all games.", tags: "NIL" },
  { athleteId: insertedAthletes[2]?.id, title: "Under Armour Apparel Deal", counterparty: "Under Armour", contractType: "Endorsement", status: "Active", valueCents: 15000000, startDate: new Date("2024-07-01"), endDate: new Date("2027-06-30"), athleteNote: "Full apparel kit provided. 3 commercial shoots per year.", tags: "Endorsement,Priority" },
  { athleteId: insertedAthletes[3]?.id, title: "Wilson Racket Sponsorship", counterparty: "Wilson Sporting Goods", contractType: "Sponsorship", status: "Active", valueCents: 3200000, startDate: new Date("2024-01-01"), endDate: new Date("2025-12-31"), athleteNote: "Equipment provided for all tournaments. Logo on racket bag.", tags: "Sponsorship" },
  { athleteId: insertedAthletes[4]?.id, title: "Rawlings Equipment Contract", counterparty: "Rawlings", contractType: "Sponsorship", status: "Draft", valueCents: 5000000, startDate: new Date("2025-06-01"), endDate: new Date("2028-05-31"), athleteNote: "Pending final signature. Equipment and glove deal.", tags: "Draft,Equipment" },
  { athleteId: insertedAthletes[0]?.id, title: "ESPN Media Appearance", counterparty: "ESPN / Disney", contractType: "Media", status: "Expired", valueCents: 1200000, startDate: new Date("2023-09-01"), endDate: new Date("2024-08-31"), athleteNote: "Completed 4 studio appearances. Contract fulfilled.", tags: "Media,Expired" },
];

console.log("  → Inserting contracts...");
for (const contract of contractData) {
  if (contract.athleteId) {
    await db.insert(contracts).values(contract).onDuplicateKeyUpdate({ set: { title: contract.title } });
  }
}
const [contractCount] = await connection.execute("SELECT COUNT(*) as count FROM contracts");
console.log(`  ✓ ${contractCount[0].count} contracts inserted`);

// ─── Opportunities ────────────────────────────────────────────────────────────
const opportunityData = [
  { athleteId: insertedAthletes[0]?.id, title: "Sprite Zero Campaign", type: "NIL", status: "In Negotiation", organization: "Coca-Cola Company", valueCents: 5000000, deadline: new Date("2025-06-30"), description: "Social media campaign for Sprite Zero targeting Gen Z athletes. 6-month deal.", notes: "Strong brand alignment. Review deck sent to team." },
  { athleteId: insertedAthletes[1]?.id, title: "NWSL Draft Selection", type: "Career", status: "Identified", organization: "National Women's Soccer League", valueCents: 70000000, deadline: new Date("2025-01-15"), description: "NWSL College Draft — projected top-5 pick.", notes: "Prepare for combine in December." },
  { athleteId: insertedAthletes[2]?.id, title: "NFL Draft — Round 1", type: "Career", status: "Identified", organization: "National Football League", valueCents: 2000000000, deadline: new Date("2025-04-24"), description: "Projected top-10 NFL Draft pick. Multiple teams showing interest.", notes: "Pro Day scheduled for March 15." },
  { athleteId: insertedAthletes[3]?.id, title: "Roland Garros Wildcard", type: "Event", status: "Contacted", organization: "French Tennis Federation", valueCents: 15000000, deadline: new Date("2025-05-01"), description: "Wildcard application for Roland Garros main draw.", notes: "Application submitted. Awaiting federation response." },
  { athleteId: insertedAthletes[4]?.id, title: "MLB Draft — Top 5 Pick", type: "Career", status: "Identified", organization: "Major League Baseball", valueCents: 800000000, deadline: new Date("2025-07-13"), description: "MLB Draft projection: top-5 overall. Multiple scouts attending spring games.", notes: "Showcase game scheduled April 10." },
  { athleteId: insertedAthletes[0]?.id, title: "State Farm Speaking Engagement", type: "Speaking", status: "Offer Received", organization: "State Farm Insurance", valueCents: 2500000, deadline: new Date("2025-03-15"), description: "Keynote at State Farm Youth Leadership Summit. 45-minute talk on perseverance.", notes: "Confirmed date: March 15. Travel covered." },
  { athleteId: insertedAthletes[5]?.id, title: "Ironman 70.3 Sponsorship", type: "Sponsorship", status: "In Negotiation", organization: "Ironman Group", valueCents: 1800000, deadline: new Date("2025-04-01"), description: "Race kit and travel sponsorship for 2025 Ironman 70.3 World Championship.", notes: "Reviewing contract terms." },
  { athleteId: insertedAthletes[1]?.id, title: "Community Soccer Clinic", type: "Community", status: "Converted", organization: "Houston Parks & Recreation", valueCents: 500000, deadline: new Date("2025-02-28"), description: "Free soccer clinic for underserved youth in Houston. 200 participants expected.", notes: "Great community impact opportunity." },
];

console.log("  → Inserting opportunities...");
for (const opp of opportunityData) {
  if (opp.athleteId) {
    await db.insert(careerOpportunities).values(opp).onDuplicateKeyUpdate({ set: { title: opp.title } });
  }
}
const [oppCount] = await connection.execute("SELECT COUNT(*) as count FROM career_opportunities");
console.log(`  ✓ ${oppCount[0].count} opportunities inserted`);

// ─── Campaigns ────────────────────────────────────────────────────────────────
const campaignData = [
  { name: "Nike Rise Campaign 2025", brand: "Nike", status: "Active", budgetCents: 50000000, startDate: new Date("2025-01-01"), endDate: new Date("2025-12-31"), description: "Multi-athlete Nike campaign featuring next-gen stars. Social, digital, and OOH.", deliverables: "12 social posts per athlete, 2 video shoots, 1 billboard campaign" },
  { name: "Gatorade Fuel Your Future", brand: "Gatorade", status: "Planning", budgetCents: 20000000, startDate: new Date("2025-03-01"), endDate: new Date("2025-08-31"), description: "Summer hydration campaign targeting college athletes.", deliverables: "8 Instagram posts, 4 TikTok videos, 2 YouTube features" },
  { name: "Under Armour Will Finds A Way", brand: "Under Armour", status: "Active", budgetCents: 35000000, startDate: new Date("2025-02-01"), endDate: new Date("2025-11-30"), description: "Inspirational campaign highlighting athlete resilience and determination.", deliverables: "Brand ambassador content, 3 commercial appearances, product launches" },
];

console.log("  → Inserting campaigns...");
for (const campaign of campaignData) {
  await db.insert(marketingCampaigns).values(campaign).onDuplicateKeyUpdate({ set: { name: campaign.name } });
}
const [campCount] = await connection.execute("SELECT COUNT(*) as count FROM marketing_campaigns");
console.log(`  ✓ ${campCount[0].count} campaigns inserted`);

// ─── Compliance Forms ─────────────────────────────────────────────────────────
const complianceData = [
  { athleteId: insertedAthletes[0]?.id, title: "NIL Disclosure — Nike Deal", type: "Disclosure", status: "APPROVED", description: "Annual NIL activity disclosure for Nike endorsement contract.", dueDate: new Date("2025-01-31") },
  { athleteId: insertedAthletes[1]?.id, title: "Pre-Season Medical Clearance", type: "Medical Clearance", status: "SUBMITTED", description: "Annual medical clearance required before pre-season training.", dueDate: new Date("2025-08-01") },
  { athleteId: insertedAthletes[2]?.id, title: "NFL Draft Background Check", type: "Background Check", status: "UNDER_REVIEW", description: "Standard NFL pre-draft background verification.", dueDate: new Date("2025-02-28") },
  { athleteId: insertedAthletes[3]?.id, title: "Drug Testing Consent — ITF", type: "Drug Testing Consent", status: "APPROVED", description: "ITF anti-doping testing consent for 2025 season.", dueDate: new Date("2025-01-15") },
  { athleteId: insertedAthletes[4]?.id, title: "Financial Disclosure — Agent Fees", type: "Financial Disclosure", status: "DRAFT", description: "Annual disclosure of agent fees and financial arrangements.", dueDate: new Date("2025-03-31") },
  { athleteId: insertedAthletes[5]?.id, title: "Travel Authorization — World Championship", type: "Travel Authorization", status: "APPROVED", description: "International travel authorization for Ironman 70.3 World Championship in Finland.", dueDate: new Date("2025-08-15") },
  { athleteId: insertedAthletes[0]?.id, title: "Media Release — ESPN Feature", type: "Media Release", status: "APPROVED", description: "Media release for ESPN 30 for 30 documentary feature.", dueDate: new Date("2025-04-30") },
];

console.log("  → Inserting compliance forms...");
for (const form of complianceData) {
  if (form.athleteId) {
    await db.insert(complianceForms).values(form).onDuplicateKeyUpdate({ set: { title: form.title } });
  }
}
const [compCount] = await connection.execute("SELECT COUNT(*) as count FROM compliance_forms");
console.log(`  ✓ ${compCount[0].count} compliance forms inserted`);

// ─── Educational Materials ────────────────────────────────────────────────────
const materialsData = [
  { title: "NIL 101: Understanding Your Rights", category: "NIL Education", contentType: "Article", description: "A comprehensive guide to NIL rules, regulations, and how to maximize your earning potential.", isFeatured: true },
  { title: "Financial Literacy for Athletes", category: "Financial Planning", contentType: "Video", description: "Learn how to budget, save, and invest your earnings for long-term financial security.", isFeatured: true },
  { title: "Social Media Brand Building", category: "Marketing", contentType: "Guide", description: "Step-by-step guide to building an authentic personal brand on Instagram, TikTok, and Twitter.", isFeatured: true },
  { title: "Contract Negotiation Basics", category: "Legal", contentType: "Article", description: "Understanding key contract terms, red flags, and negotiation strategies.", isFeatured: false },
  { title: "Mental Health & Performance", category: "Wellness", contentType: "Podcast", description: "Sports psychologists discuss managing pressure, anxiety, and maintaining peak mental performance.", isFeatured: true },
  { title: "Transitioning to Professional Sports", category: "Career Development", contentType: "Webinar", description: "Former collegiate athletes share their experiences transitioning to professional leagues.", isFeatured: false },
  { title: "Tax Planning for Athletes", category: "Financial Planning", contentType: "Guide", description: "Understanding multi-state taxation, deductions, and working with sports-specialized accountants.", isFeatured: false },
  { title: "Media Training Fundamentals", category: "Media & PR", contentType: "Video", description: "How to handle press conferences, interviews, and social media with professionalism.", isFeatured: false },
];

console.log("  → Inserting educational materials...");
for (const material of materialsData) {
  await db.insert(educationalMaterials).values(material).onDuplicateKeyUpdate({ set: { title: material.title } });
}
const [matCount] = await connection.execute("SELECT COUNT(*) as count FROM educational_materials");
console.log(`  ✓ ${matCount[0].count} educational materials inserted`);

// ─── Business Partners ────────────────────────────────────────────────────────
const partnersData = [
  { name: "Morgan Stanley Sports Finance", category: "Financial Planning", description: "Specialized financial planning and wealth management for professional athletes.", website: "https://morganstanley.com", contactEmail: "sports@morganstanley.com", isFeatured: true },
  { name: "Wasserman Media Group", category: "Other", description: "Full-service sports marketing and talent representation.", website: "https://teamwass.com", contactEmail: "talent@teamwass.com", isFeatured: true },
  { name: "Foley & Lardner LLP", category: "Legal", description: "Sports and entertainment law firm specializing in athlete contracts.", website: "https://foley.com", contactEmail: "sports@foley.com", isFeatured: false },
  { name: "Gatorade Sports Science Institute", category: "Other", description: "Performance nutrition and hydration research for elite athletes.", website: "https://gssiweb.org", contactEmail: "athletes@gssi.com", isFeatured: true },
  { name: "IMG Academy", category: "Other", description: "World-class athletic training and academic programs.", website: "https://imgacademy.com", contactEmail: "admissions@imgacademy.com", isFeatured: false },
];

console.log("  → Inserting business partners...");
for (const partner of partnersData) {
  await db.insert(businessPartners).values(partner).onDuplicateKeyUpdate({ set: { name: partner.name } });
}
const [partCount] = await connection.execute("SELECT COUNT(*) as count FROM business_partners");
console.log(`  ✓ ${partCount[0].count} business partners inserted`);

// ─── Community Outreach ───────────────────────────────────────────────────────
const outreachData = [
  { title: "Youth Basketball Clinic — Atlanta", type: "Youth Program", status: "Completed", date: new Date("2025-01-20"), location: "Atlanta, GA", description: "Free basketball clinic for 150 youth ages 8-16 in underserved Atlanta neighborhoods.", participantCount: 150 },
  { title: "Soccer for All — Houston", type: "Community Service", status: "Upcoming", date: new Date("2025-03-08"), location: "Houston, TX", description: "International Women's Day soccer event featuring Aaliyah Williams. Free for all participants.", participantCount: 200 },
  { title: "STEM + Sports Workshop", type: "Workshop", status: "Upcoming", date: new Date("2025-04-15"), location: "Nashville, TN", description: "Combining sports analytics and STEM education for high school students.", participantCount: 80 },
  { title: "Mental Health Awareness Walk", type: "Charity Event", status: "Upcoming", date: new Date("2025-05-10"), location: "Boulder, CO", description: "Annual 5K walk raising awareness and funds for athlete mental health resources.", participantCount: 500 },
];

console.log("  → Inserting community outreach...");
for (const outreach of outreachData) {
  await db.insert(communityOutreach).values(outreach).onDuplicateKeyUpdate({ set: { title: outreach.title } });
}
const [outCount] = await connection.execute("SELECT COUNT(*) as count FROM community_outreach");
console.log(`  ✓ ${outCount[0].count} outreach programs inserted`);

await connection.end();
console.log("\n✅ Seed complete! Athletes Collaborative database is ready.");
