# Retrivo Vault — developer notes

Individual-focused RAG SaaS. **No teams / workspaces / org roles — never add them.**
See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the full picture.

Keep user-facing copy (marketing, app text, emails, notifications, meta) consistent
in voice and naming. Never call it a "portfolio project" in user copy;
"open source, built by one person" is the pitch and lives on `/about`.

## Layout

- `backend/` — Node + Express (ESM), MongoDB Atlas + Vector Search, Gemini.
  Tests: Vitest + `mongodb-memory-server` + `supertest`.
- `frontend/` — React + Vite + TS + Tailwind + shadcn/ui + GSAP + Recharts.
  Tests: Vitest + Testing Library (jsdom).
- Design tokens live in `frontend/src/index.css` and the Tailwind config; match
  the existing components (dark-only, mono display type, token classes).

## Commands

```bash
cd backend  && npm test                                    # ~78 tests
cd frontend && npm run typecheck && npm run lint && npm test && npm run build   # ~34 tests
```

CI (`.github/workflows/ci.yml`) runs all of the above.

## Conventions (do not regress)

- **Every DB query is scoped by `req.user.id`.** Quota checks in `middleware/quota.js`
  return `402`/`403` with `details.code` (`quota_exceeded` / `feature_locked`).
- **Plan in force = `user.effectivePlan()`** — resolves paid → admin comp grant
  → 14-day Pro trial → free. Use `planFor(user)` from `config/plans.js`, never
  `getPlan(user.plan)`.
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
- Frontend motion: **Framer Motion** for component reveals + micro-interactions
  (`components/motion/*` — `Reveal`/`Stagger`, `SpotlightCard`, `TiltCard`,
  `MagneticButton`; tokens in `lib/anim.ts`); **GSAP** (`lib/motion.ts`) only for
  the hero headline / count-up / aurora; **CSS** `animate-in` for app rows. The
  motion components check `useReducedMotion()`; `framer-motion` is mocked in
  `src/test/setup.ts`.
- Frontend data hooks tolerate malformed responses (`Array.isArray(...) ? ... : []`).

## Local dev

`cd backend && npm run dev` boots with **zero config** (no `.env` → in-memory Mongo
+ demo mode). Vector retrieval and AI calls return a clean `502` until `MONGO_URI`
(Atlas) and `GEMINI_API_KEY` are set.

**Admin access:** set `ADMIN_EMAIL` + `ADMIN_PASSWORD` (12+ chars) and the root
admin is created/repaired at boot; `npm run seed:admin` does the same on demand
and rotates the password. `ADMIN_EMAILS=a@x.com,b@x.com` promotes existing
accounts as extra admins. Only the root admin can change roles, and the root
account can't be suspended/demoted/deleted through the API.

**Admin console conventions:** every mutating `/api/admin/*` handler goes through
`loadTarget(req, …)` (guards root + self) and writes an `AdminAudit` row via
`audit(req, action, target, meta)` (fire-and-forget). Presence lifecycle lives in
`services/presence.js` and is driven from `services/refreshTokens.js` — never
write `UserSession` directly from a controller. Broadcast fan-out
(`services/broadcast.js`) is in-process and chunked, like the scheduler. Web Push
(`services/pushService.js`) and the whole broadcast "push" channel no-op unless
`VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` are set (`pushEnabled`).

## Known limitations

- Vector search + live Gemini/Stripe can't run without real credentials — verified
  to the provider boundary (mocked in tests, clean `502` in dev).
- Ingestion queue + rate-limit store + scheduler are in-process / single-instance.
- No visual browser QA has been done (no browser tooling in the build env).
