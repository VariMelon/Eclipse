# Eclipse Project Handoff (2026-02-19)

## Current Status
- Prisma 7 + Neon is working with adapter-based client setup.
- Authentication is working (signup/signin + NextAuth credentials).
- Dashboard is protected by session and uses signed-in user identity.
- Username is required and unique at schema + DB migration level.
- Input validation is centralized and applied to API create/auth endpoints.
- Blocked-words moderation list is active and cleaned.
- App API routes are now session-protected and resource lists are scoped to authorized user/campaign access.
- Campaign membership workflows are implemented (invite, approve, decline, remove, change-role).
- Auth routes are rate-limited (signup/signin + NextAuth credentials callback).
- Production deployment is live on Vercel.

## Key Files
- Prisma client: `lib/prisma.ts`
- Prisma config: `prisma/prisma.config.ts`
- Schema: `prisma/schema.prisma`
- Shared auth options: `lib/auth.ts`
- NextAuth route: `app/api/auth/[...nextauth]/route.ts`
- Pages auth APIs (stable in this setup):
  - `pages/api/signup.ts`
  - `pages/api/signin.ts`
- Dashboard:
  - `app/dashboard/page.tsx` (server-protected)
  - `app/dashboard/DashboardClient.tsx` (client UI)
- Input validation: `lib/inputValidation.ts`
- Blocked words list: `config/blocked-words.txt`

## Infrastructure Notes
- Next.js: 16.1.6 (Turbopack)
- Prisma: 7.4.0
- DB: Neon Postgres
- Prisma 7 requires adapter object, not raw URL string.
- Current implementation uses `@prisma/adapter-neon` + `@neondatabase/serverless`.

## Completed Work
1. Fixed Prisma initialization issues by moving to Neon adapter pattern.
2. Implemented/verified signup + signin APIs.
3. Wired auth pages and redirect flow to dashboard.
4. Added session-protected dashboard route.
5. Added MVP dashboard modules for campaigns/characters/notes/friends.
6. Enforced unique usernames:
   - `User.name` is required + unique.
   - Migration applied: `20260219185722_unique_usernames`.
7. Added centralized input filtering:
   - Dangerous chars blocked: control chars, `*`, `%`, `_`, `?`.
   - Blocked terms loaded from file + optional env list.
8. Cleaned blocked words list integrity:
   - No duplicates
   - No special-character entries that conflict with validator
9. Added API-side authorization + scoped list access:
  - `app/api/campaigns` restricted to session user campaigns/memberships
  - `app/api/characters` restricted to owned or campaign-accessible characters
  - `app/api/notes` restricted to owned/campaign-accessible notes and character-linked checks
  - `app/api/friends` restricted to requester/receiver scope with safer create semantics
  - `app/api/users` restricted to current session user profile only
10. Removed non-production/testing and duplicate resources:
  - Removed temporary testing surfaces and duplicate routes
  - Removed unused default static assets
  - Simplified home page to product-facing navigation and trimmed unneeded dashboard payload fields
11. Added campaign membership + role workflows:
  - `app/api/campaigns/members` supports invite, approve, decline, remove, and role-change actions
  - campaign invite state persisted in schema/migrations
12. Enforced GM/moderator role checks on campaign-scoped mutation endpoints:
  - campaign character creation restricted to GM/moderator
  - campaign note creation restricted to GM/moderator
13. Added auth rate limiting:
  - `pages/api/signup` and `pages/api/signin` now enforce per-IP + per-email windows
  - `app/api/auth/[...nextauth]` credentials callback now enforces per-IP limits
14. Deployed to Vercel production and verified core route reachability.

## Moderation / Validation Behavior
- Validation entrypoint: `validateUserInput()` in `lib/inputValidation.ts`.
- Blocked terms sources:
  1. `config/blocked-words.txt` (one term per line, `#` comments allowed)
  2. `.env` `INPUT_BLACKLIST_WORDS` (comma-separated)
- Current blocked words file stats after cleanup:
  - Total active terms: 447
  - Unique terms: 447
  - Duplicates: 0

## Environment Variables
Required:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`

Optional:
- `INPUT_BLACKLIST_WORDS` (comma-separated additional blocked terms)

## How to Test Quickly
1. `npm run dev`
2. Signup page: `/auth/signup`
3. Signin page: `/auth/signin`
4. Dashboard: `/dashboard` (requires active session)
5. API checks:
   - `POST /api/signup`
   - `POST /api/signin`
6. DB inspection: `npx prisma studio`

## Known Constraints
- App Router + Prisma 7 can be sensitive under Turbopack; current setup is stabilized with shared adapter client.
- Pages auth API endpoints are currently used for stable signup/signin testing.

## Next Recommended Steps
1. Add automated tests for auth, role authorization, and campaign membership transitions.
2. Consider distributed rate limiting (e.g., Redis-backed) for stronger multi-instance production throttling.
3. Implement PWA deliverables (manifest/service-worker/offline behavior) if included in launch scope.

## Deployment Readiness (Current)
- Build status: PASS (`npm run build` completed successfully on 2026-02-19).
- Auth status: PASS (signup/signin API flows verified).
- Session-protected dashboard: PASS.
- Prisma migration status: PASS (`unique_usernames` + campaign invite/member uniqueness migrations applied in production).
- Input validation/moderation: PASS (centralized validator active).
- Local preflight scripts: ADDED (`npm run preflight`, `npm run health:api`, `npm run preflight:full`).
- Preflight execution: PASS (`npm run preflight` runs lint + build successfully with no lint warnings).
- Vercel deployment status: PASS (production live at `https://eclipse-five-wheat.vercel.app`).
- Vercel environment status: PASS (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` configured for production).
- Production smoke (GET reachability): PASS (`/`, `/auth/signup`, `/auth/signin`, `/dashboard` redirect, `/api/signup`, `/api/signin`, `/api/users` unauthorized).
- Production smoke (authenticated flow): PASS (signup, NextAuth session, campaign create, invite member, approve invite, membership verify).
- Production moderation check: PASS (`POST /api/signup` rejects forbidden characters with `400` and error `Input field 'name' contains forbidden characters.`).
- Production rate-limit check: PASS (`POST /api/signin` enforces limiter and returns `429` with `Retry-After` and `X-RateLimit-*` headers after repeated attempts).
- Release verification timestamp (UTC): `2026-02-19T20:42:40Z`.

## Test Coverage (Current)
- Test runner: Vitest (`npm run test`).
- Added backend tests:
  - `tests/pages/signup.test.ts`
  - `tests/pages/signin.test.ts`
  - `tests/app/campaign-members.test.ts`
- Current local test status: PASS (21 tests passing, including validation/range and error-envelope paths).

## API Error Envelope Status
- App API routes now use shared error helpers for `400/401/403/404/405/409` paths where applicable.
- Error payload format is standardized as `{ error: string }` across current API handlers.

## Field Validation Status
- Field-level constraints are enforced on key inputs:
  - auth (`email` format, password length, username length)
  - campaigns (`name` length)
  - campaign members (`campaignId`/`userId` UUID format)
  - characters (`name` length, `level` range)
  - notes (`content` length, alias count/length)
  - friends (`receiverId` UUID format)

## Temporary Testing Resources (Status)
- Temporary testing surfaces were removed from the production codebase.

## Vercel Deployment Checklist

### 1) Repository + Project
1. If a GitHub repo is linked, push latest branch and import it in Vercel.
2. If no repo is linked yet, create/import the repo later and continue local validation now.
3. Keep framework preset as Next.js.

### 2) Environment Variables (Vercel)
Set these in Vercel Project Settings → Environment Variables:
- `DATABASE_URL` = Neon Postgres connection string
- `NEXTAUTH_SECRET` = long random secret
- `NEXTAUTH_URL` = production base URL (for example `https://your-app.vercel.app`)
- `INPUT_BLACKLIST_WORDS` (optional) = comma-separated extra blocked terms

### 3) Build/Runtime Defaults
- Node version: use Vercel default (or align to local if pinned later).
- Install command: `npm install`
- Build command: `npm run build`
- Output: Next.js default

### 3.5) Pre-Release Cleanup (Testing Surfaces)
1. Confirm no temporary testing routes/pages were reintroduced.
2. Run `npm run preflight` before deploy.

### 4) Post-Deploy Smoke Test
After first deploy, verify:
1. `/auth/signup` renders and creates a user.
2. `/auth/signin` renders and signs in.
3. `/dashboard` redirects when logged out; loads when logged in.
4. `POST /api/signup` and `POST /api/signin` return success for valid payloads.
5. Dashboard create flows work for campaigns/characters/notes/friends.

### Local Preflight Commands
Use these before pushing/deploying:
1. `npm run preflight` (lint + build)
2. `npm run health:api` (requires local app running; checks `/api/signup` and `/api/signin`)
3. `npm run preflight:full` (runs both)
4. No git status/diff check is required for this handoff when a repo is not linked.

### 5) Data/Infra Validation
1. Confirm created records in Neon (or Prisma Studio from local against same DB).
2. Confirm username uniqueness enforcement still returns expected error for duplicates.
3. Confirm moderation blocks terms from `config/blocked-words.txt` and optional env list.

### 6) Known Production Notes
- Current stable auth API paths for manual testing are Pages Router endpoints (`/api/signup`, `/api/signin`).
- App Router endpoints exist; keep using current shared Prisma adapter setup in `lib/prisma.ts`.
- If callback URLs/session issues appear in production, re-check `NEXTAUTH_URL` first.

## New Chat Bootstrap Prompt
Use this in a fresh chat to save tokens:

"Read `docs/handoff.md` and continue implementation from the Next Recommended Steps section. Prioritize API-side authorization and role-based access for campaign resources."

## Before New Chat (Quick Checklist)
- Current local baseline: `npm run preflight` passes (lint + build clean).
- Git linkage: configured (`main` tracking `origin/main` at `https://github.com/VariMelon/Eclipse.git`; baseline commit available via `git rev-parse --short HEAD`).
- Deployment execution status: deployed to Vercel (`https://eclipse-five-wheat.vercel.app`).
- Core completed areas: Prisma/Neon setup, auth flow, protected dashboard, unique usernames, centralized input validation, blocked words workflow, session-scoped API authorization, membership workflows, role-based mutation controls, and auth rate limiting.
- Highest-priority unfinished work: automated test coverage + deeper post-deploy functional validation + PWA deliverables.
- Highest-priority unfinished work: automated test coverage + PWA deliverables.
- Suggested first task in next chat: add API test suite for auth + campaign membership/role authorization and run against local + deployed environments.
