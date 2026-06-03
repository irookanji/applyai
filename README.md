# ApplyAI

[![CI](https://github.com/irookanji/applyai/actions/workflows/ci.yml/badge.svg)](https://github.com/irookanji/applyai/actions/workflows/ci.yml)

AI-powered job application assistant that tailors your CV, drafts cover letters, and tracks every application in one place.

## Features

- Paste a vacancy URL or job description — ApplyAI parses the posting
- Upload your master CV PDF — AI extracts text and tailors it per role
- Generate a role-specific cover letter via Anthropic Claude
- Track application history with status labels (Applied, Interview, Rejected, No response)
- Filter and search past applications
- Duplicate detection warns if you already applied to the same role
- Copy or download tailored CV as PDF

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, Tailwind CSS v4, TanStack Query, TanStack Form, Preact Signals |
| Backend | Hono on Bun |
| Database | PostgreSQL + Drizzle ORM |
| AI | Anthropic API (`claude-sonnet-4-20250514`) |
| Tooling | Biome (lint/format), Knip, [Bun test](https://bun.com/docs/test) |
| Infra | Docker Compose |

## Monorepo structure

```
applyAI/
├── apps/
│   ├── api/          # Hono REST API
│   └── web/          # React SPA
├── packages/
│   ├── db/           # Drizzle schema & migrations
│   └── shared/       # Zod schemas & shared types
└── docker-compose.yml
```

## Quick start

### 1. Clone and configure

```bash
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
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

Open [http://localhost:5173](http://localhost:5173). The Vite dev server proxies `/api` to the Hono API on port 3000.

### Docker (full stack)

```bash
docker compose up --build
```

## UX flow

1. **History** is the default screen - stats, searchable list, detail panel
2. **New application** wizard:
   - Step 1: Input (URL or description + CV PDF)
   - Step 2: AI generation
   - Step 3: Review & save
3. After saving, the app returns to History with the new entry selected

## API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Health check |
| GET | `/applications` | List with filters & stats |
| GET | `/applications/:id` | Application detail |
| PATCH | `/applications/:id` | Update status / notes |
| POST | `/applications/check-duplicate` | Duplicate pre-check |
| POST | `/applications/generate` | AI generation pipeline |
| POST | `/applications` | Save application |
| GET | `/cv/master` | Master CV metadata |
| POST | `/cv/master` | Upload master CV PDF |

## AI prompt design

The Anthropic service acts as a career coach with strict rules:

- Never invent experience not present in the uploaded CV
- Reframe existing skills toward the job requirements
- Return structured JSON: company, title, match score, tailored CV bullets, cover letter, key requirements

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `CORS_ORIGIN` | Allowed frontend origin (default `http://localhost:5173`) |
| `UPLOADS_DIR` | Directory for uploaded CV PDFs |
| `PORT` | API port (default `3000`) |

## Testing

Tests use Bun's built-in Jest-compatible runner ([docs](https://bun.com/docs/test)). Co-located `*.test.ts` files live next to the code they cover.

```bash
bun run test           # All tests in apps/ and packages/
bun run test:watch     # Watch mode
bun run test:api       # API tests only
bun run test:shared    # Shared package tests only
```

Current coverage:

| Workspace | Tests |
|-----------|-------|
| `packages/shared` | Zod schemas, date/hash helpers |
| `apps/api` | Health route, job parser, applications service |

## CI

GitHub Actions runs on every push and pull request to `main` (see [.github/workflows/ci.yml](.github/workflows/ci.yml)):

1. `bun install --frozen-lockfile`
2. `bun run lint` — Biome
3. `bun test apps packages` — Bun test runner
4. `bun run build` — TypeScript + Vite production build
5. `bun run knip` — unused code and dependencies

Run the same pipeline locally: `bun run ci`

## Scripts

```bash
bun run dev          # API + web concurrently
bun run dev:api      # API only
bun run dev:web      # Web only
bun run build        # Production web build
bun run db:up        # Start PostgreSQL (Docker)
bun run db:generate  # Generate Drizzle migration
bun run db:migrate   # Apply migrations
bun run ci           # Same checks as GitHub Actions (lint, test, build, knip)
bun run lint         # Biome lint + format check
bun run lint:fix     # Biome auto-fix (includes import sorting)
bun run format       # Biome format
bun run test         # Run all tests
bun run test:watch   # Tests in watch mode
bun run knip         # Scan for unused exports, deps, files
```

## Portfolio notes

This project demonstrates:

- End-to-end AI integration with structured LLM outputs
- Monorepo architecture with shared validation schemas
- Preact Signals for UI mode state + TanStack Query for server state
- PDF ingestion and client-side PDF export
- Bun-native API tests with co-located unit tests
- Practical UX patterns (history-first, no dead-end screens, duplicate warnings)
