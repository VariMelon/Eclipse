# Eclipse

Eclipse is a full-stack TTRPG (Tabletop Role-Playing Game) campaign management platform built with Next.js, Prisma, and PostgreSQL. It provides a collaborative space for game masters and players to create campaigns, manage characters, share game systems, and coordinate sessions.

## Features

- **Authentication** — Credential-based sign-up/sign-in with email verification, password reset, and NextAuth session management.
- **Campaign Management** — Create and manage campaigns with role-based membership (Game Master, Moderator, Player). Invite players, approve requests, and export/import campaigns as JSON.
- **Game Systems** — Define reusable, shareable game rule systems with JSON-based schemas covering dice, stats, character wizards, races, classes, spells, weapons, armor, and more. Systems can be public or private and are linked to campaigns and characters.
- **Characters** — Create characters with system-specific stats. Global characters require an explicit system; campaign characters inherit the campaign's system.
- **Notes** — Campaign-scoped and character-scoped notes with alias support.
- **Friends & Notifications** — Send and receive friend requests; accept or decline campaign invites. Real-time notification actions in the UI.
- **Accessibility** — Dyslexia-friendly typography via the Lexend font with globally standardised line-height and letter-spacing.
- **PWA Support** — Web app manifest and offline fallback page included.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Next.js 16 (App Router + Pages Router), TailwindCSS 4 |
| Backend | Next.js API routes (Node.js runtime) |
| Database | PostgreSQL via Neon serverless adapter, Prisma 7 |
| Auth | NextAuth 4, bcryptjs |
| Email | Nodemailer (Zoho SMTP by default) |
| Caching / Rate-limiting | Upstash Redis |
| Language | TypeScript 5.9 |
| Testing | Vitest |
| Linting | ESLint 9 + eslint-config-next |

## Project Structure

```
app/               # Next.js pages and API routes (App Router)
├── auth/          # Sign-up, sign-in, password reset
├── campaigns/     # Campaign list and detail pages
├── characters/    # Character list and creation pages
├── systems/       # Game system list and editor
├── dashboard/     # Protected user dashboard
├── friends/       # Friend requests and notifications
└── api/           # Session-protected REST endpoints

lib/               # Shared utilities (auth, email, prisma, validation, rate-limiting)
prisma/            # Prisma schema and migrations
tests/             # Vitest test suite (53 tests)
docs/              # Architecture and implementation documentation
scripts/           # Maintenance and migration utilities
```

## Local Development

```bash
npm install
npm run dev        # http://localhost:3000
```

## Required Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon) |
| `NEXTAUTH_SECRET` | Session encryption secret |
| `NEXTAUTH_URL` | Auth callback base URL |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM_EMAIL` | Sender email address |

Optional:

| Variable | Default |
|---|---|
| `SMTP_HOST` | `smtp.zoho.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` (`true` for port 465) |
| `SMTP_FROM_NAME` | `Eclipse` |
| `INPUT_BLACKLIST_WORDS` | _(none)_ |

## Testing

```bash
npm test           # Run all tests once
npm run test:watch # Watch mode
```

## Quality Checks

```bash
npm run preflight        # Lint + build
npm run preflight:full   # Lint + build + API health check (requires dev server)
```

## Main Routes

| Route | Description |
|---|---|
| `/auth/signup` | Create a new account |
| `/auth/signin` | Sign in |
| `/dashboard` | Protected user dashboard |
| `/campaigns` | Campaign list |
| `/characters` | Character list |
| `/systems` | Game system list |
| `/friends` | Friend requests and notifications |

## API Routes

| Route | Description |
|---|---|
| `/api/signup` | User registration (Pages Router) |
| `/api/signin` | Credential sign-in (Pages Router) |
| `/api/auth/[...nextauth]` | NextAuth handler |
| `/api/campaigns` | Campaign CRUD |
| `/api/campaigns/[id]/export` | Campaign export |
| `/api/campaigns/import` | Campaign import |
| `/api/characters` | Character CRUD |
| `/api/systems` | Game system CRUD |
| `/api/notes` | Note CRUD |
| `/api/friends` | Friend requests |
| `/api/users` | User lookup |
| `/api/notifications` | Notification list |
| `/api/notifications/actions` | Accept / decline notification actions |

## Documentation

- [System Architecture](docs/system-architecture.md) — Game system design and refactoring details.
- [Campaign Export / Import](docs/campaign-export-import.md) — JSON export format specification.
- [Email Verification & Password Reset](docs/email-verification-and-password-reset.md) — Auth email flows.
- [Project Handoff](docs/handoff.md) — Implementation status, deployment notes, and next steps.

## Deployment

The application is deployed on Vercel. Prisma migrations run automatically during the build step. Live deployment: <https://eclipse-five-wheat.vercel.app>
