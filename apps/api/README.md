# @applyai/api

Hono REST API for ApplyAI: application CRUD, master CV storage, job posting resolution, and Gemini-powered tailoring.

Full-stack setup, product features, and CI: [../../README.md](../../README.md).

## Stack

| Area | Tech |
|------|------|
| Runtime | [Bun](https://bun.sh) |
| HTTP | [Hono](https://hono.dev) |
| Database | PostgreSQL via `@applyai/db` (Drizzle ORM) |
| Validation | Zod schemas in `@applyai/shared` |
| AI | Google Gemini (`@google/generative-ai`) |
| Job URLs | `linkedom` + `@mozilla/readability` |
| PDFs | `pdf-parse` |

## Project structure

```
apps/api/src/
├── index.ts              # Server entry (Bun.serve)
├── app.ts                # Hono app, CORS, /health, error handler
├── config.ts             # Env → config object
├── load-env.ts           # Resolves monorepo root for paths
├── routes/
│   └── applications.ts   # /applications and /cv routers
└── services/
    ├── gemini.ts         # LLM prompts + structured JSON
    ├── job-parser.ts     # URL fetch + readability extraction
    ├── applications.ts   # CRUD + list/stats
    ├── master-cv.ts      # Master CV upload & text resolution
    ├── pdf.ts            # PDF text extraction
    └── duplicate.ts      # Duplicate detection by URL/hash/title
```

Co-located tests: `*.test.ts` next to `app.ts` and under `services/`.

## Run locally

From the **repository root** (API loads `../../.env`):

```bash
cp .env.example .env
# Set GEMINI_API_KEY — https://aistudio.google.com

bun run db:up
bun install
bun run db:migrate
bun run dev:api
```

- API: [http://localhost:3000](http://localhost:3000) (`GET /health` → `{ "status": "ok" }`)
- With the web app: `bun run dev:web` — Vite proxies `/api` to port 3000

Workspace scripts (`apps/api/package.json`):

| Script | Command |
|--------|---------|
| `dev` | `bun --watch --env-file=../../.env src/index.ts` |
| `start` | `bun --env-file=../../.env src/index.ts` |
| `test` | `bun test` |

From root: `bun run dev:api` · `bun run test:api`

## Environment variables

Configured in the repo root `.env` (see [.env.example](../../.env.example)). Defaults in `src/config.ts`.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `GEMINI_API_KEY` | Google AI Studio API key (required for generation) |
| `GEMINI_MODEL` | Model id (default `gemini-2.5-flash-lite`; e.g. `gemini-2.5-flash` for higher quality) |
| `CORS_ORIGIN` | Allowed frontend origin (default `http://localhost:5173`) |
| `UPLOADS_DIR` | Directory for uploaded CV PDFs (default `./uploads`, resolved from repo root) |
| `PORT` | Listen port (default `3000`) |

## API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Health check |
| GET | `/applications` | List with filters and stats |
| GET | `/applications/:id` | Application detail |
| PATCH | `/applications/:id` | Update status, notes, CV, or cover letter |
| POST | `/applications/check-duplicate` | Duplicate pre-check (JSON) |
| POST | `/applications/generate` | AI generation pipeline (`multipart/form-data`) |
| POST | `/applications` | Save application (JSON) |
| GET | `/cv/master` | Master CV metadata |
| POST | `/cv/master` | Upload master CV PDF (`multipart/form-data`) |

### `GET /applications`

Query params:

- `status` — `applied` \| `interview` \| `rejected` \| `no_response`
- `search` — optional text filter

Response: `{ applications, stats }` (see `@applyai/shared`).

### `POST /applications/check-duplicate`

JSON body (at least one of `jobUrl` or `jobDescription`):

```json
{
  "jobUrl": "https://example.com/jobs/123",
  "jobDescription": "optional pasted text",
  "companyName": "optional",
  "jobTitle": "optional"
}
```

Response: `{ isDuplicate, existingApplication }`.

### `POST /applications/generate`

`multipart/form-data` fields:

| Field | Required | Description |
|-------|----------|-------------|
| `jobUrl` | One of URL or description | Vacancy URL (fetched and parsed) |
| `jobDescription` | One of URL or description | Pasted posting text |
| `cvFile` | No | PDF upload; falls back to stored master CV |

Pipeline: resolve job text → resolve CV text (upload or DB) → Gemini → duplicate check → preview JSON (`companyName`, `jobTitle`, `tailoredCv`, `coverLetter`, `matchScore`, `keyRequirements`, `isDuplicate`, …).

### `POST /applications`

JSON body matches `createApplicationRequestSchema` in `@applyai/shared` (fields from the generate preview plus optional `status`, default `applied`). Returns `201` with the saved application.

### `PATCH /applications/:id`

JSON: optional `status`, `notes`, `cvSent`, `coverLetter`.

### `POST /cv/master`

`multipart/form-data`: field `file` (PDF). Returns `201` with master CV metadata.

## AI prompt design

`src/services/gemini.ts` acts as a career coach with strict rules:

- Never invent experience, skills, employers, or achievements not present in the CV
- Reframe and emphasize relevant existing experience for the target role
- Professional, concise tone (European tech job markets)
- Tailored CV as bullet points; cover letter in 3–4 short paragraphs
- Match score 0–100 from real CV alignment
- Return only valid JSON matching `aiGenerationResultSchema` in `@applyai/shared`:

  `companyName`, `jobTitle`, `matchScore`, `tailoredCv`, `coverLetter`, `keyRequirements`

## Testing

[Bun test](https://bun.com/docs/test) with co-located `*.test.ts` files.

```bash
# From repo root
bun run test:api

# From apps/api
bun test
```

| Area | Coverage |
|------|----------|
| `app.test.ts` | Health route, app wiring |
| `services/job-parser.test.ts` | URL/description resolution |
| `services/applications.test.ts` | CRUD, list, stats, hashing |

## Docker

Built from [Dockerfile](./Dockerfile) as the `api` service in [docker-compose.yml](../../docker-compose.yml):

- Exposes port `3000`
- Runs `bun run db:migrate` then `bun run start`
- Requires `GEMINI_API_KEY` (and DB) from compose env

Full stack: `docker compose up --build` from the repo root.

## Related packages

| Package | Role |
|---------|------|
| `@applyai/db` | Drizzle schema, migrations, `Db` type injected per request |
| `@applyai/shared` | Zod request/response types shared with the web app |
