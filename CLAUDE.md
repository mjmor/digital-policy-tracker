# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # Run Next.js linter
npm run test         # Run all tests (Vitest)
npm run test:watch   # Run tests in watch mode
```

**Run a single test file:**
```bash
npx vitest run tests/parse-event.test.ts
npx vitest run tests/parse-event.test.ts -t "test name"  # by test name
```

## Architecture

**Digital Policy Tracker** is a Next.js (App Router) dashboard for tracking global digital policy events from the Digital Policy Alert (DPA) API. It adds a local review queue workflow on top of the external API.

### Data Flow

1. **Query** — Client sends filters → `/api/dpa` proxies to DPA external API → results shown in `ResultsTable`
2. **Sync** — `/api/dpa/sync` fetches recent DPA events and inserts into local SQLite DB (`INSERT OR IGNORE` on `dpa_id`)
3. **Review Queue** — `ReviewQueue` component fetches pending events from DB; users can review, archive, restore, or delete
4. **Server Actions** — `app/actions/events.ts` wraps DB mutations as Next.js server actions callable from client components

### Key Subsystems

| Area | Files | Notes |
|------|-------|-------|
| API routes | `app/api/dpa/`, `app/api/events/[id]/` | REST endpoints; `/api/dpa` validates `limit` 0–1000 |
| Server actions | `app/actions/events.ts` | `syncEvents`, `reviewEvent`, `archiveEvent`, `restoreEvent`, `deleteEvent` |
| Database | `lib/db.ts` | Raw SQL via `better-sqlite3`; no ORM; schema auto-initialized on import |
| DPA client | `lib/dpa-client.ts` | Thin fetch wrapper for `/api/dpa` |
| Types | `lib/event-types.ts`, `lib/dpa-types.ts` | `StoredEvent`, `ReviewStatus`, DPA API shapes |
| Auth middleware | `middleware.ts` | Clerk on all routes except `/`, `/sign-in`, `/sign-up`; **bypassed on localhost** |

### Database

SQLite at `.data/events.db` (or `$DATA_DIR/events.db`; uses `/tmp/.data` in production). Schema is defined and auto-created in `lib/db.ts`. The `events` table has a `review_status` column (`pending | reviewed | archived`) as the core state machine.

Tests use a separate DB at `.data/test-events.db`, cleaned up in `tests/setup.ts`.

### Authentication

Clerk (`ClerkProvider` in root layout). Auth is **skipped on localhost** — the middleware short-circuits for `localhost`/`127.0.0.1`, so local development doesn't require Clerk credentials.

### Styling

Minimal — primarily inline React styles. `app/globals.css` is the only stylesheet.

## Environment Variables

Required (see `.env.example`):
- `DPA_API_KEY` — External DPA API key
- `NEXT_PUBLIC_CLERK_*` and `CLERK_SECRET_KEY` — Clerk authentication
