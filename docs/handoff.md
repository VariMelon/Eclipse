# Eclipse Project Handoff (2026-02-20)

## Current Status
- Prisma 7 + Neon adapter setup is stable.
- Auth (signup/signin + NextAuth credentials) is working with email verification.
- Email verification and password reset flows are fully operational.
- Session-protected dashboard and App Router APIs are in place.
- Campaign membership flows (invite, approve, decline, remove, role change) are implemented.
- System architecture refactored: systems are independent entities referenced by campaigns.
- Notifications for friend requests and campaign invites are live.
- Campaign export/import is live (JSON v1.0).
- Global typography is standardized and dyslexia-friendly (Lexend).
- Production deployment is live on Vercel at `https://eclipse-portal.com`.

## Key Files
- App layout + global styles:
  - `app/layout.tsx`
  - `app/globals.css`
- Navigation:
  - `app/NavBar.tsx`
- Auth:
  - `app/auth/signin/page.tsx`
  - `app/auth/signup/page.tsx`
  - `app/auth/reset-password/page.tsx`
  - `pages/api/signup.ts`
  - `app/api/verify-email/route.ts`
  - `app/api/auth/password-reset/route.ts`
  - `app/api/auth/reset-password/route.ts`
  - `app/api/auth-status/route.ts`
  - `lib/auth.ts`
  - `lib/email.ts`
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

## Schema Updates (2026-02-19 - 2026-02-20)
- System model added with JSON-based rule fields (dice, stats, wizards, content).
- Campaign model uses `systemId` relation instead of free-text system.
- Character model includes `systemId` relation (required for global characters, derived for campaign characters).
- User model extended with email verification fields:
  - `emailVerified`: timestamp of verification
  - `emailVerificationToken`: token for verification link
  - `emailVerificationExpires`: expiration timestamp
- PasswordReset model added for password reset tokens with 24-hour expiration.

## Migrations Applied
- `20260219233000_cascade_delete_campaign`
- `20260219235000_create_system_table`
- `20260219240000_add_character_system`
- `20260220_add_email_verification_and_password_reset`

## Email Verification & Password Reset (2026-02-20)
### Features
- **Email Verification**: New signups receive verification email with token link (48-hour expiration).
- **Password Reset**: Users can request reset emails with secure tokens (24-hour expiration).
- **Auth Status Endpoint**: `/api/auth-status` for health checks (SMTP config, database columns).

### Implementation
- `lib/email.ts`: Nodemailer transport with Zoho SMTP.
- `pages/api/signup.ts`: Creates user with verification token, sends email, rolls back on failure.
- `app/api/verify-email/route.ts`: Validates token, updates user, redirects to signin.
- `app/api/auth/password-reset/route.ts`: Generates reset token, sends email.
- `app/api/auth/reset-password/route.ts`: Validates token, updates password, deletes token.
- `app/auth/signin/page.tsx`: Forgot password UI, verification success message.
- `app/auth/reset-password/page.tsx`: Password reset form with token validation.
- `lib/auth.ts`: NextAuth credentials provider checks `emailVerified` before allowing signin.

### Production Configuration
- **SMTP Provider**: Zoho Mail (`smtp.zohocloud.ca:465` SSL)
- **Environment Variables** (Vercel Production):
  - `SMTP_HOST=smtp.zohocloud.ca`
  - `SMTP_PORT=465`
  - `SMTP_SECURE=true`
  - `SMTP_USER=vari@eclipse-portal.com`
  - `SMTP_PASS=<app-password>`
  - `SMTP_FROM_EMAIL=vari@eclipse-portal.com`
  - `SMTP_FROM_NAME=Eclipse`
  - `NEXTAUTH_URL=https://eclipse-portal.com`
- **Domain**: `https://eclipse-portal.com` (Vercel production alias)
- **Database**: Neon Postgres with pooling enabled.

### Known Issues
- Emails may appear in spam until SPF/DKIM/DMARC DNS records are configured for `eclipse-portal.com`.

## Recent Changes (2026-02-19 - 2026-02-20)
- **Email Verification & Password Reset** (2026-02-20):
  - Implemented full email verification flow for new signups.
  - Added password reset request and confirmation flow.
  - Created auth status health check endpoint.
  - Configured production SMTP with Zoho Mail.
  - Applied email verification migration to production database.
  - Updated `NEXTAUTH_URL` to production domain (`https://eclipse-portal.com`).
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
   - `/auth/signup` - create account, check email for verification link
   - Click verification link, should redirect to signin with success message
   - `/auth/signin` - sign in with verified account
   - Click "Forgot password?" to test password reset flow
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
8. Auth Status:
   - Visit `/api/auth-status` to check SMTP and database health

## Deployment Readiness
- Tests: PASS (53/53)
- Build: PASS
- Production URL: `https://eclipse-portal.com`
- Prisma client regenerated after latest schema updates.
- Production migrations applied successfully.
- Email verification and password reset flows operational.

## Test Coverage
- Vitest: `npm test`
- Tests include campaigns, characters, notes, friends, users, auth, and members.

## Next Recommended Steps
1. **Email Deliverability**: Configure SPF, DKIM, and DMARC DNS records for `eclipse-portal.com` to reduce spam classification.
2. Validate Lexend font and global typography on production UI.
3. Confirm character creation rules (system required for global, derived for campaign).
4. Run a full production smoke test (auth + campaign + notifications + export/import).
5. Consider adding UI wizards for system rules (future scope).
6. Monitor email verification and password reset flows in production logs.
