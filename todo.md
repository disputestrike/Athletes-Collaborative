# Athletes Collaborative — Project TODO

## Design System & Global Setup
- [x] Upload logo and configure brand assets
- [x] Configure global CSS with brand colors (orange #F97316, teal #1F7692, Inter font)
- [x] Set up DashboardLayout with dual-shell navigation (Athlete Portal + Admin Command Center)
- [x] Build reusable StatusBadge, KPICard, EmptyState, PageHeader components

## Database Schema
- [x] Extend users table with role enum (owner, admin, agent, manager, marketing_coordinator, compliance_reviewer, athlete, family_member, external_partner)
- [x] Create athlete_profiles table
- [x] Create team_members table
- [x] Create family_members table
- [x] Create contracts table (status: Draft, Active, Expired, Terminated)
- [x] Create contract_documents table
- [x] Create career_opportunities table (types: Career, NIL, Sponsorship, Endorsement, Event, Media, Speaking, Community)
- [x] Create marketing_campaigns table
- [x] Create campaign_athletes junction table
- [x] Create compliance_forms table (types: Disclosure, Medical Clearance, Background Check, Drug Testing Consent, Financial Disclosure, Travel Authorization, Media Release)
- [x] Create message_threads and messages tables
- [x] Create educational_materials table
- [x] Create business_partners table
- [x] Create community_outreach table
- [x] Create profile_update_requests table
- [x] Push migrations

## Backend Routers
- [x] athletes router (CRUD, profile management, update requests)
- [x] contracts router (CRUD, status transitions, notes separation)
- [x] opportunities router (CRUD, pipeline, conversion tracking)
- [x] campaigns router (CRUD, athlete associations)
- [x] compliance router (CRUD, workflow state machine)
- [x] messages router (threads, send, read receipts)
- [x] growth router (materials, partners, outreach)
- [x] admin router (analytics, user management, KPIs)
- [x] team_members router
- [x] family_members router

## Athlete Portal
- [x] Login page (branded orange, magic link)
- [x] Dashboard/Home (KPI cards, quick actions, representation alert, opportunities feed, messages)
- [x] Profile page (photo, bio, sport, team, family, update request flow)
- [x] Contracts list page (status filters, renewal alerts)
- [x] Contract detail page (documents, timeline, athlete-visible notes only)
- [x] Opportunities list page (type filters, status, deadline)
- [x] Opportunity detail page (full description, action workflow)
- [x] Marketing campaigns list page
- [x] Campaign detail page (assets, metrics, deliverables)
- [x] Compliance forms list page (due dates, status badges)
- [x] Compliance form detail page (upload, notes, reviewer info)
- [x] Growth hub page (materials, partners, outreach)
- [x] Messages inbox page (threads, read/unread, search)
- [x] Settings page (account, notifications, preferences)

## Admin Command Center
- [x] Admin dashboard (KPI cards, revenue forecast, activity feed, sport distribution chart)
- [x] Athlete profiles management table
- [x] Family members management table
- [x] Team members management table
- [x] Contracts management table (inline edit, bulk actions, CSV export)
- [x] Career opportunities management table
- [x] Marketing campaigns management table
- [x] Compliance forms management table (approve/reject workflow)
- [x] Messages management
- [x] Business/Financial partners management
- [x] Educational materials management
- [x] Community outreach management
- [x] Portal users / access control management

## Testing
- [x] Write vitest tests for athletes router
- [x] Write vitest tests for contracts router
- [x] Write vitest tests for compliance workflow state machine
- [x] Write vitest tests for role-based access control

## Seed Data
- [ ] Seed 6 sample athletes (basketball, soccer, football, tennis, baseball, triathlon)
- [ ] Seed sample contracts, opportunities, campaigns, compliance forms
- [ ] Seed growth content (materials, partners, outreach)
