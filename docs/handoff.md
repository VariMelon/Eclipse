# Eclipse Project Handoff (2026-02-19)

## Current Status
- Prisma 7 + Neon adapter setup is stable.
- Auth (signup/signin + NextAuth credentials) is working.
- Session-protected dashboard and App Router APIs are in place.
- Campaign membership flows (invite, approve, decline, remove, role change) are implemented.
- System architecture refactored: systems are independent entities referenced by campaigns.
- Notifications for friend requests and campaign invites are live.
- Campaign export/import is live (JSON v1.0).
- Global typography is standardized and dyslexia-friendly (Lexend).
- Production deployment is live on Vercel.

## Key Files
- App layout + global styles:
  - `app/layout.tsx`
  - `app/globals.css`
- Navigation:
  - `app/NavBar.tsx`
- Systems:
  - `app/systems/page.tsx`
  - `app/systems/[id]/page.tsx`
  - `app/api/systems/route.ts`
  - `app/api/systems/[id]/route.ts`
- Characters:
  - `app/characters/page.tsx`
  - `app/characters/new/page.tsx`
  - `app/api/characters/route.ts`
- Campaigns:
  - `app/campaigns/page.tsx`
  - `app/campaigns/[id]/page.tsx`
  - `app/api/campaigns/route.ts`
  - `app/api/campaigns/[id]/export/route.ts`
  - `app/api/campaigns/import/route.ts`
- Notifications:
  - `app/friends/page.tsx`
  - `app/api/notifications/route.ts`
  - `app/api/notifications/actions/route.ts`
- Prisma:
  - `prisma/schema.prisma`
  - `prisma/prisma.config.ts`
  - `lib/prisma.ts`

## Schema Updates (2026-02-19)
- System model added with JSON-based rule fields (dice, stats, wizards, content).
- Campaign model uses `systemId` relation instead of free-text system.
- Character model includes `systemId` relation (required for global characters, derived for campaign characters).

## Migrations Applied
- `20260219233000_cascade_delete_campaign`
- `20260219235000_create_system_table`
- `20260219240000_add_character_system`

## Recent Changes (End of Day)
- Characters navbar simplified: single link to `/characters` (dropdown removed).
- Create Character button aligned to right for consistency.
- Create System button font weight matched other CTAs.
- Global typography standardized:
  - Lexend added as global sans font.
  - Global line-height and letter-spacing added.
  - Consistent font weights for body, headings, and form controls.
- Systems PATCH response now returns `_count` to prevent UI crash after save.
- Characters creation flow updated:
  - Global characters require system selection.
  - Campaign characters inherit the campaign's system.
  - `/api/characters` validates system access and sets `systemId`.
  - `stats` defaults to `{}` when omitted.
- Campaign list API now includes system info for character creation UI.

## How to Test Quickly
1. `npm run dev`
2. Auth:
   - `/auth/signup` and `/auth/signin`
3. Systems:
   - Create a system in `/systems`
   - Edit and save system (verify no crash)
4. Campaigns:
   - Create campaign using the system
5. Characters:
   - `/characters/new` requires a system when no campaign is selected
   - Select a campaign to auto-use its system
6. Notifications:
   - Send a friend request and campaign invite, accept/decline
7. Export/Import:
   - Export a campaign, then import from file

## Deployment Readiness
- Tests: PASS (53/53)
- Build: PASS
- Latest deploy: `https://eclipse-five-wheat.vercel.app`
- Prisma client regenerated after latest schema updates.

## Test Coverage
- Vitest: `npm test`
- Tests include campaigns, characters, notes, friends, users, auth, and members.

## Next Recommended Steps
1. Validate Lexend font and global typography on production UI.
2. Confirm character creation rules (system required for global, derived for campaign).
3. Run a full production smoke test (auth + campaign + notifications + export/import).
4. Consider adding UI wizards for system rules (future scope).
