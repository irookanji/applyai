# ApplyAI

[![CI](https://github.com/irookanji/applyai/actions/workflows/ci.yml/badge.svg)](https://github.com/irookanji/applyai/actions/workflows/ci.yml)

AI-powered job application assistant that tailors your CV, drafts cover letters, and tracks every application in one place.

## Features

- Paste a vacancy URL or job description — ApplyAI parses the posting
- Upload your master CV PDF — AI extracts text and tailors it per role
- Generate a role-specific cover letter via Google Gemini
- Track application history with status labels (Applied, Interview, Rejected, No response)
- Filter and search past applications
- Duplicate detection warns if you already applied to the same role
- Copy or download tailored CV as PDF

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, Tailwind v4 — [apps/web/README.md](apps/web/README.md) |
| Backend | Hono on Bun — [apps/api/README.md](apps/api/README.md) |
| Database | PostgreSQL + Drizzle ORM (`packages/db`) |
| AI | Google Gemini (API service in `apps/api`) |
| Tooling | Biome (lint/format), Knip, [Bun test](https://bun.com/docs/test) |
| Infra | Docker Compose |

## Monorepo structure

```
applyAI/
├── apps/
│   ├── api/          # Hono REST API — see [apps/api/README.md](apps/api/README.md)
│   └── web/          # React SPA — see [apps/web/README.md](apps/web/README.md)
├── packages/
│   ├── db/           # Drizzle schema & migrations
│   └── shared/       # Zod schemas & shared types
└── docker-compose.yml
```

## Quick start

### 1. Clone and configure

```bash
cp .env.example .env
# Add your GEMINI_API_KEY from https://aistudio.google.com to .env
```

### 2. Start PostgreSQL

```bash
bun run db:up
```

### 3. Install dependencies & migrate

```bash
bun install
bun run db:migrate
```

### 4. Run locally

```bash
# Terminal 1 — API
bun run dev:api

# Terminal 2 — Web
bun run dev:web
```

Open [http://localhost:5173](http://localhost:5173) ([web docs](apps/web/README.md)). Vite proxies `/api` to port 3000 ([API docs](apps/api/README.md)).

### Docker (full stack)

```bash
docker compose up --build
```

## Testing

Tests use Bun's built-in Jest-compatible runner ([docs](https://bun.com/docs/test)). Co-located `*.test.ts` files live next to the code they cover.

```bash
bun run test           # All tests in apps/ and packages/
bun run test:watch     # Watch mode
bun run test:api       # API only — see [apps/api/README.md](apps/api/README.md)
bun run test:shared    # Shared package tests only
```

Per-workspace docs: [apps/web/README.md](apps/web/README.md) (UX flow) · [apps/api/README.md](apps/api/README.md) (tests) · `packages/shared` (Zod schemas, date/hash helpers)

## CI

GitHub Actions runs on every push and pull request to `main` (see [.github/workflows/ci.yml](.github/workflows/ci.yml)):

1. `bun install --frozen-lockfile`
2. `bun run lint` — Biome
3. `bun test apps packages` — Bun test runner
4. `bun run build` — TypeScript + Vite production build
5. `bun run knip` — unused code and dependencies

Run the same pipeline locally: `bun run ci`

## Portfolio notes

This project demonstrates:

- End-to-end AI integration with structured LLM outputs
- Monorepo architecture with shared validation schemas
- Preact Signals for UI mode state + TanStack Query for server state
- PDF ingestion and client-side PDF export
- Bun-native API tests with co-located unit tests
- Practical UX patterns (history-first, no dead-end screens, duplicate warnings)
