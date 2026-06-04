# @applyai/web

React SPA for ApplyAI: application history, new-application wizard, and client-side CV PDF export.

Monorepo setup and CI: [../../README.md](../../README.md) · REST API: [../api/README.md](../api/README.md).

## Stack

| Area | Tech |
|------|------|
| UI | React 19, TypeScript |
| Build | Vite 8, `@vitejs/plugin-react` |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Server state | TanStack Query |
| Forms | TanStack Form (wizard steps) |
| UI / nav state | Preact Signals (`@preact/signals-react`) |
| PDF export | `@react-pdf/renderer` |
| Types | `@applyai/shared` |

## Project structure

```
apps/web/src/
├── App.tsx                          # History vs new-application mode
├── main.tsx                         # QueryClient + root mount
├── signals/
│   ├── app.ts                       # mode$, wizard, filters, selection
│   └── theme.ts                     # Light / dark preference
├── lib/
│   ├── api.ts                       # fetch wrapper → /api/*
│   ├── cv-pdf.tsx / CvPdfDocument.tsx
│   └── utils.ts
├── features/
│   ├── history/                     # List, stats, detail, reapply
│   └── new-application/             # 3-step wizard
└── components/                      # Header, theme toggle, UI primitives
```

## Run locally

From the **repository root** (API must be running for data):

```bash
bun run dev:api    # terminal 1 — port 3000
bun run dev:web    # terminal 2 — port 5173
```

Open [http://localhost:5173](http://localhost:5173).

Vite proxies `/api` → `http://localhost:3000` (paths rewritten without the `/api` prefix). The client uses `fetch('/api/...')` in `src/lib/api.ts`.

| Script | Description |
|--------|-------------|
| `dev` | Vite dev server |
| `build` | `tsc --noEmit` + production bundle |
| `preview` | Serve production build locally |

Root: `bun run dev:web` · `bun run build` (web only via workspace filter).

## UX flow

1. **History** (default) — stats, searchable list, detail panel, status filters
2. **New application** wizard:
   - Step 1: job URL or description + optional CV PDF
   - Step 2: AI generation (loading state)
   - Step 3: review tailored CV and cover letter, then save
3. After save → back to History with the new entry selected
4. **Reapply** from history pre-fills step 1 from a past application

Navigation uses `mode$` / `wizardStep$` signals; lists and mutations use TanStack Query against `src/lib/api.ts`.

## Docker

Built from [Dockerfile](./Dockerfile) as the `web` service in [docker-compose.yml](../../docker-compose.yml). Production build sets `VITE_API_URL` for the API origin.

Full stack: `docker compose up --build` from the repo root.
