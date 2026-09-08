# Retrivo Vault — developer notes

Individual-focused RAG SaaS. **No teams / workspaces / org roles — never add them.**
See `retrivo-vault-architecture.md` and `features.md` for the full picture.

## Layout

- `backend/` — Node + Express (ESM), MongoDB Atlas + Vector Search, Gemini. Tests: Vitest + `mongodb-memory-server` + `supertest`.
- `frontend/` — React + Vite + TS + Tailwind + shadcn/ui + GSAP + Recharts. Tests: Vitest + Testing Library (jsdom).
- `frontend/design-system/retrivo-vault/MASTER.md` — the visual source of truth (tokens, motion, component specs). Follow it for any UI work.

## Commands

```bash
# backend
cd backend && npm test              # ~47 tests
node --check src/server.js

# frontend
cd frontend && npm run typecheck && npm run lint && npm test && npm run build
```

CI (`.github/workflows/ci.yml`) runs all of the above on push/PR.

## Conventions

- Backend: every DB query is scoped by `req.user.id`. Quota checks live in `middleware/quota.js` and return `402`/`403` with `details.code` (`quota_exceeded` / `feature_locked`).
- Backend: the Gemini SDK is **mocked in tests** (`src/test/setup.js`) — never call it directly in a test. Rate limiters and retries are also skipped/fast under test.
- Backend: refresh tokens rotate (`services/refreshTokens.js` + `RefreshToken` model). Wrap every external model call in `withRetry()` (`utils/retry.js`).
- Backend: optional integrations (Stripe, SMTP) must degrade gracefully when their env vars are unset. Guard with `billingEnabled` / `mailEnabled` from `config/env.js`.
- Frontend: dark theme only. Use Tailwind token classes (`bg-card`, `text-muted-foreground`, …), never raw hex. Lucide icons only, never emoji.
- Frontend: all motion must respect `prefers-reduced-motion` — use the helpers in `lib/motion.ts`, which already guard.
- Frontend: surface API errors with `notifyApiError()` so quota/feature errors become an "Upgrade" prompt.
- Plans are defined in `backend/src/config/plans.js` and `frontend/src/lib/plans.ts` — keep the two in sync.

## Charts

Follow the `dataviz` skill. The validated categorical pair for the dark chart surface
is blue `#3987e5` / orange `#d95926` (see `components/app/settings/UsageChart.tsx`).

## Local dev

`cd backend && npm run dev` boots with **zero config**: no `.env` → ephemeral
in-memory MongoDB + demo mode (`config/env.js` `autoMongo` / `demoMode`,
`server.js` `resolveMongoUri`). Vector retrieval and AI calls return a clean `502`
until `MONGO_URI` (Atlas) and `GEMINI_API_KEY` are set.

## Known limitations

- Vector search + live Gemini/Stripe can't run without real credentials — verified
  up to the provider boundary (mocked in tests, clean `502` in dev).
- Ingestion queue is in-process (single instance). Swap `services/jobQueue.js` for BullMQ + Redis to scale horizontally.
- Data fetching uses hand-rolled hooks + polling; TanStack Query would be the upgrade.
- No visual browser QA has been done (no browser tooling in the build env).
