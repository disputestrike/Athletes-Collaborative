# Athletes Collaborative

Athletes Collaborative is a standalone React, Express, tRPC, Drizzle, and PostgreSQL app for managing athlete profiles, contracts, opportunities, campaigns, compliance, messaging, growth resources, tenant companies, athlete landing pages, lead capture, and CRM follow-up workflows.

## Stack

- React 19 + Vite + Tailwind
- Express 4 + tRPC 11
- Google OAuth for sign-in
- PostgreSQL with Drizzle ORM and migrations
- Local upload storage served from `/uploads`

## Platform Areas

- Parent platform with white-label tenant/company management.
- Public athlete pages at `/a/:slug` with stats, media, news, social links, and tenant branding.
- Athlete media library with staff approval before content is published publicly.
- Internal CRM with lead capture at `/lead/:tenantSlug`, guardian contact fields, meeting records, and follow-up paths.
- Tenant-level settings for DocuSign, Adobe Sign, Google Calendar, Zoom, and backend SMS automation placeholders.

## Local Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create `.env`:

   ```bash
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/athletes_collaborative
   JWT_SECRET=replace-with-a-long-random-string
   APP_BASE_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/callback
   OWNER_EMAIL=you@example.com
   VITE_GOOGLE_MAPS_API_KEY=optional-browser-maps-key
   GOOGLE_MAPS_API_KEY=optional-server-maps-key
   OPENAI_API_KEY=optional-openai-key
   NOTIFICATION_WEBHOOK_URL=optional-webhook-url
   ```

   In development, the app provides a local owner user and demo tenant/CRM/page data so you can test without Google OAuth or a migrated database. Set `USE_DATABASE_IN_DEV=true` if you want local development to read and write the PostgreSQL data immediately.

3. Run migrations:

   ```bash
   pnpm db:push
   ```

4. Start development:

   ```bash
   pnpm dev
   ```

## Deployment Notes

For Railway, set the same environment variables in the service. The production Google OAuth redirect URI should be:

```text
https://athletes-collaborative-production.up.railway.app/api/oauth/callback
```

Also add that exact URI to the Google Cloud OAuth client.

## Scripts

- `pnpm dev` starts the Express/Vite dev server.
- `pnpm build` builds the client and bundles the server into `dist`.
- `pnpm start` runs the production server.
- `pnpm check` runs TypeScript.
- `pnpm test` runs Vitest.
- `pnpm db:push` generates and applies Drizzle migrations.
- `pnpm db:seed` loads sample data into PostgreSQL.

## Auth

The browser starts sign-in at `/api/auth/google`. The server redirects to Google, handles `/api/oauth/callback`, stores or updates the user in PostgreSQL, and sets the `app_session_id` session cookie. Protected tRPC procedures receive the signed-in user through `ctx.user`.

Set `OWNER_EMAIL` to automatically grant the first owner account after Google sign-in. `OWNER_OPEN_ID` is also supported if you want to target the stored `google:<sub>` identifier directly.

During local development, clicking sign-in or get started goes directly into the portal. Production still requires configured Google OAuth credentials.
