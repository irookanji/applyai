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

### Run with Docker (recommended)

Only [Docker Desktop](https://www.docker.com/products/docker-desktop/) is required — no Bun install needed.

```bash
git clone https://github.com/irookanji/applyai.git
cd applyai
./start.sh
```

On first run, `start.sh` creates `.env` from `.env.example`. Add your `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com), then run `./start.sh` again.

Open [http://localhost:5173](http://localhost:5173) when the containers are up. Stop with `Ctrl+C`.

Equivalent without the helper script:

```bash
cp .env.example .env   # add GEMINI_API_KEY
docker compose up --build
```

### Local development

For day-to-day coding, use Bun and run Postgres in Docker:

**Prerequisites:** [Bun](https://bun.sh), [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```bash
cp .env.example .env   # add GEMINI_API_KEY
bun run db:up
bun install
bun run db:migrate

# One terminal — API + web (stops Docker api/web if still running from ./start.sh)
bun run dev

# Or split across two terminals:
# bun run dev:api
# bun run dev:web
```

Open [http://localhost:5173](http://localhost:5173) ([web docs](apps/web/README.md)). Vite proxies `/api` to port 3000 ([API docs](apps/api/README.md)).

If you previously ran `./start.sh`, stop it with `Ctrl+C` or run `bun run docker:stop-app` before local dev. `bun run dev` does this automatically.

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
