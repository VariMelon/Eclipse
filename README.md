# Eclipse

Eclipse is a Next.js + Prisma + Neon application with credential auth, a protected dashboard, and session-scoped APIs for campaigns, characters, notes, and friends.

## Project Handoff

For current implementation status, operational notes, and deployment guidance, see [docs/handoff.md](docs/handoff.md).

## Local Development

Install dependencies and start development:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Required Environment Variables

- `DATABASE_URL`
- `NEXTAUTH_SECRET`

Optional:

- `INPUT_BLACKLIST_WORDS`

## Quality Checks

```bash
npm run preflight
```

Full local preflight (requires dev server running in another terminal):

```bash
npm run preflight:full
```

## Main Routes

- `/auth/signup`
- `/auth/signin`
- `/dashboard`

## API Routes

- `/api/signup` (Pages Router)
- `/api/signin` (Pages Router)
- `/api/auth/[...nextauth]`
- `/api/campaigns`
- `/api/characters`
- `/api/notes`
- `/api/friends`
- `/api/users`
