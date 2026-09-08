# Retrivo Vault — developer notes

Individual-focused RAG SaaS. **No teams / workspaces / org roles — never add them.**
See `retrivo-vault-architecture.md` and `features.md` for the full picture.

## Layout

- `backend/` — Node + Express (ESM), MongoDB Atlas + Vector Search, Gemini.
  Tests: Vitest + `mongodb-memory-server` + `supertest`.
- `frontend/` — React + Vite + TS + Tailwind + shadcn/ui + GSAP + Recharts.
  Tests: Vitest + Testing Library (jsdom).
- `frontend/design-system/retrivo-vault/MASTER.md` — visual source of truth
  (tokens, motion, component specs). Follow it for any UI work.

## Commands

```bash
cd backend  && npm test                                    # ~78 tests
cd frontend && npm run typecheck && npm run lint && npm test && npm run build   # ~34 tests
```

CI (`.github/workflows/ci.yml`) runs all of the above.

## Conventions (do not regress)

- **Every DB query is scoped by `req.user.id`.** Quota checks in `middleware/quota.js`
  return `402`/`403` with `details.code` (`quota_exceeded` / `feature_locked`).
- **Plan in force = `user.effectivePlan()`** (respects the 14-day Pro trial). Use
  `planFor(user)` from `config/plans.js`, never `getPlan(user.plan)`.
- **User input**: coerce strings with `str()` and validate ids with the local
  `asId()` before touching Mongo. The global `mongoSanitize` middleware strips
  `$`/dotted keys but string-method calls on objects still crash — always `str()`.
- **The Gemini SDK is mocked in tests** (`src/test/setup.js`). Rate limiters and
  retries are skipped/instant under test. `makeUser()` clears the trial by default
  (pass `{ keepTrial: true }` to test trial behavior).
- Optional integrations (Stripe, SMTP) degrade gracefully when unset — guard with
  `billingEnabled` / `mailEnabled`.
- Refresh tokens rotate (`services/refreshTokens.js`). Wrap every external model
  call in `withRetry()` (`utils/retry.js`).
- `notify()` / `logActivity()` / `dispatchWebhook()` are **fire-and-forget** — never
  `await` them in the request path; tests must add a small delay before asserting.
- Frontend: dark theme only, token classes not raw hex, Lucide icons only, all
  motion respects `prefers-reduced-motion`. Surface API errors with `notifyApiError()`.
- Frontend data hooks tolerate malformed responses (`Array.isArray(...) ? ... : []`).

## Local dev

`cd backend && npm run dev` boots with **zero config** (no `.env` → in-memory Mongo
+ demo mode). Vector retrieval and AI calls return a clean `502` until `MONGO_URI`
(Atlas) and `GEMINI_API_KEY` are set. `ADMIN_EMAILS=you@x.com` grants `/app/admin`.

## Known limitations

- Vector search + live Gemini/Stripe can't run without real credentials — verified
  to the provider boundary (mocked in tests, clean `502` in dev).
- Ingestion queue + rate-limit store + scheduler are in-process / single-instance.
- No visual browser QA has been done (no browser tooling in the build env).
