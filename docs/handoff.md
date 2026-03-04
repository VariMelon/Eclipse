# Eclipse Project Handoff (2026-03-03)

## Current Status
- Production alias is live: `https://eclipse-portal.com`.
- Systems wizard is form-driven and beginner-friendly (no raw JSON required from users).
- Classes are managed via dedicated add/edit/delete modal flow.
- Skills are now first-class system content (`skills`) and `Stat Blocks.subStats` is obsolete.
- Class `Proficiency (Skills)` is handled via Additional Resources (including level progression rows).
- Systems block taxonomy has been cleaned up:
  - Removed `Level Up Effects` block (class progression is defined in Classes).
  - `Spells` block is presented as `Magic (School)`.
  - Added `Magic (Application)`, `Features (Class)`, `Features (Race)`, and `Cross System Definitions`.

## Completed Changes (Recent)

### Systems + Classes UX
- Added Skills block in the systems editor (`name`, `modifierStat`).
- Kept class skill proficiency in Additional Resources so skill grants can be added/changed by level.
- Proficiency labels source from system blocks:
  - Skills -> Skills block
  - Stats -> Stat Blocks primary stats
  - Weapons/Armor/Tools -> corresponding blocks (+ categories where applicable)

### Data Model + APIs
- Added `System.skills` JSON field in Prisma schema.
- Added migration: `prisma/migrations/20260303114000_add_system_skills/migration.sql`.
- Systems APIs (`app/api/systems/route.ts`, `app/api/systems/[id]/route.ts`) persist/read `skills` directly.
- Added new `System` JSON fields in Prisma schema and APIs:
  - `featuresClass`
  - `featuresRace`
  - `magicApplications`
  - `crossSystemDefinitions`
- Added migration: `prisma/migrations/20260303124500_add_system_content_blocks/migration.sql`.

### Backward Compatibility
- Legacy `proficienciesSkills` entries still map into current class resource model when editing older classes.

## Prisma Shell + Reachability Runbook
- Prisma config is in `prisma/prisma.config.ts` and uses `process.env.DATABASE_URL`.
- Working setup sequence:
  1. `npx vercel env pull .env.local --environment=production`
  2. Load `.env.local` into the current PowerShell process env.
  3. Normalize URL before running Prisma:
     - `$env:DATABASE_URL = ($env:DATABASE_URL -replace '\r|\n','').Trim()`
- If `prisma migrate deploy` throws intermittent `P1001` on Neon pooler, retry loop can succeed.
- Migration `20260303114000_add_system_skills` has been applied successfully.

## Validation Snapshot
- Tests: PASS `54/54` via `npm run test`.
- Type diagnostics for touched files: clean.

## Latest Patch (Wording/UX Text)
- Updated class modal helper text to clarify required fields and avoid stale wording.
- Clarified skills guidance text to distinguish starting choices from level-based proficiency grants.
- Deployed to production alias: `https://eclipse-portal.com`.

## Latest Session Updates (2026-03-03 Night)
- Continued standardization to keep block setup form-based and avoid end-user JSON authoring.
- Weapons and Armor now follow a two-step flow:
  - Step 1: keyword definitions.
  - Step 2: item definitions.
- Keyword flags now support:
  - `Proficiency` (feeds class proficiency options).
  - `Additional Damage Profile` (weapons).
  - `Modifier` with static definition.
- Added static keyword `Modifier` configuration for Weapons and Armor:
  - Checkbox: `Modifier`.
  - Target selector: `Attribute`, `Skill`, or `Value` (`Damage Increase`, `Armor Value`, `Dodge Value`).
  - Modifier definition text input.
  - Modifier metadata is stored at keyword level and is not edited per item.
- Weapons damage die choices are sourced from the Dice block (plus `Coin Flip` and `Flat Damage` options).
- Save-path and parser validations were tightened around optional range/additional-damage fields to avoid false blocking.
- Build/diagnostics were clean before deploy, and production alias is updated.

## Deploy Snapshot
- Last production deploy command: `npx vercel --prod --yes`
- Last deploy status: success (`Exit Code 0`)
- Active production alias: `https://eclipse-portal.com`

## Key Files
- `app/systems/[id]/page.tsx`
- `app/api/systems/route.ts`
- `app/api/systems/[id]/route.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20260303114000_add_system_skills/migration.sql`
- `prisma/migrations/20260303124500_add_system_content_blocks/migration.sql`

## Do-Not-Regress Constraints
- Verify spelling for all user-facing labels, headings, button text, and helper copy before applying or deploying changes.
- Keep wizard UX form-based (no end-user JSON authoring).
- Keep class roster workflow (add/edit/delete single class entries).
- Use the Dice System block as the reference pattern for future block configuration UX.
  - No starter/preset step as a required first step.
  - Keep configuration editing direct and form-based.
  - Prefer concise metadata fields with clear hint text.
  - Avoid mandatory preview/JSON exposure in the main block card.
- Keep Additional Resources typed rules:
  - Currency -> amount required
  - Features (Class) -> label + definition required, no amount
  - Features -> no label, amount required
  - Proficiency (Stats/Skills/Weapons/Armor/Tools) -> no amount field
- Keep skills sourced from Skills block; do not reintroduce `subStats` dependency.
- Keep `Magic (School)` and `Magic (Application)` as separate blocks.
- Keep `Features`, `Features (Class)`, and `Features (Race)` as separate blocks.
