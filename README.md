# Retrivo Vault

**The research assistant that only knows what you've read.** A production-grade,
**individual-focused** Retrieval-Augmented Generation (RAG) SaaS. Sign up (14-day Pro
trial, no card), verify your email, add your contracts, papers and notes (PDF · TXT ·
Markdown · DOCX · CSV · **web pages by URL**) to a private vault, and ask it anything
through a streaming, citation-backed chat — every answer carries the passage it came
from — with feedback, sharing and a ⌘K palette.
Free / Pro / Max plans with trial-aware quotas, Stripe billing, in-app + email
notifications, an activity log + data export, personal API keys, HMAC-signed webhooks,
an OpenAPI spec, and a lightweight admin console.

> Individuals only — no teams, workspaces, or org roles, by design.

See [`retrivo-vault-architecture.md`](./retrivo-vault-architecture.md) for the full design
and [`features.md`](./features.md) for the feature list.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + **TypeScript**, Tailwind, shadcn/ui (Radix), React Router, GSAP, Recharts |
| Design system | `frontend/design-system/retrivo-vault/` — dark developer-tool aesthetic (OLED canvas, warm bone accent, monospace status chips). Dark, JetBrains Mono + IBM Plex Sans. |
| Backend | Node.js + Express (ESM), SSE streaming, pino logging |
| Database | MongoDB Atlas + Atlas Vector Search (`$vectorSearch`, 768-dim cosine) |
| AI | Google Gemini `text-embedding-004` + `gemini-2.5-flash` |
| Auth | JWT access + **rotating** httpOnly refresh cookie · bcrypt · login lockout · `x-api-key` |
| Email | Nodemailer (SMTP; console fallback in dev) |
| Billing | Stripe Checkout + Customer Portal + webhooks (degrades gracefully when unset) |
| Ingestion | In-process job queue (concurrency, priority, retry, backpressure) |
| Tests / CI | Vitest (~115 tests, incl. adversarial hardening suites) · GitHub Actions |
| Deploy | Docker + Docker Compose |

---

## Quick start

```bash
cd backend  && npm install && npm run dev     # :5000 — works with ZERO config
cd frontend && npm install && npm run dev     # :5173 — proxies /api -> :5000
```

**Zero-config dev:** with no `backend/.env`, `npm run dev` starts an **ephemeral
in-memory MongoDB** and runs in demo mode (emails auto-verified, billing stubbed).
Every endpoint works except **vector retrieval** (needs Atlas) and **AI calls**
(need a Gemini key) — you get a clear `502` there until you configure them.

**Real setup:** `cp backend/.env.example backend/.env`, fill in `MONGO_URI` (a MongoDB
**Atlas** cluster — Vector Search is Atlas-only), `GEMINI_API_KEY`, and JWT secrets, then
`cd backend && npm run create-index`. Set `ADMIN_EMAILS=you@example.com` to unlock `/app/admin`.

**Checks:** `cd backend && npm test` · `cd frontend && npm run typecheck && npm run lint && npm test && npm run build`

### Routes

Marketing: `/` · `/pricing` · `/docs` · `/terms` · `/privacy` · `/s/:shareId` (public shared chat)
Auth: `/login` · `/signup` · `/forgot-password` · `/reset-password` · `/verify-email`
App: `/app` (Chat) · `/app/documents` · `/app/collections` · `/app/admin` ·
`/app/settings` (`?tab=profile|billing|notifications|keys|webhooks|activity|account`)

---

## Docker

```bash
cp backend/.env.example backend/.env      # fill in real values
docker compose up --build
docker compose run --rm backend npm run create-index   # once
```

App: http://localhost:8080 · API: http://localhost:5000/api. nginx serves the static
bundle and proxies `/api` (SSE-friendly). Containers run non-root with healthchecks.

---

## Plans & quotas

| | Free | Pro | Max |
|---|---|---|---|
| Documents · storage | 20 · 50 MB | 500 · 2 GB | 5,000 · 20 GB |
| Questions / month | 100 | 3,000 | 20,000 |
| Collections | 3 | 50 | 500 |
| BYO Gemini key · priority queue | — | ✓ | ✓ |
| API keys · webhooks · API access | — | — | ✓ |

Every signup gets a **14-day Pro trial** (`user.effectivePlan()`). Over-limit requests
return `402`/`403` with `details.code` (`quota_exceeded` / `feature_locked`); the UI
turns these into an "Upgrade" prompt.

---

## Optional integrations

- **Stripe** — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, four price IDs
  (`STRIPE_PRICE_{PRO,MAX}_{MONTHLY,ANNUAL}`). Local: `stripe listen --forward-to
  localhost:8080/api/billing/webhook`. Without a key, billing is disabled and everyone
  stays on Free.
- **Email** — `SMTP_URL`. Without it, emails print to the console.
- **`DEMO_MODE=true`** — auto-verify emails, stub billing (portfolio demos).
- **`ADMIN_EMAILS`** — comma-separated list granted `/api/admin/*`.

---

## API

Full surface in `retrivo-vault-architecture.md` §7, or the live spec at
`GET /api/public/openapi.json` (rendered at `/docs`). `/api/documents` and `/api/chat`
also accept an `x-api-key` header (Max plan keys).

---

## Security

Rotating refresh tokens with reuse detection · per-account login lockout · `helmet` ·
credentialed CORS · rate limiting (auth/refresh/upload/chat) · **NoSQL-injection
sanitizer** + string/id coercion · every framework error mapped to a 4xx (no 500 on
bad input) · webhook SSRF protection (private/metadata hosts blocked) · ingestion
input caps (text length, chunk count, queue depth) · MIME + size checks before parsing,
in-memory only · every query scoped by `userId` (vector index included) · one-time
tokens & keys stored as SHA-256 hashes, TTL-indexed · Stripe webhook signature verified
against the raw body · no user enumeration on password reset · pino logging with secret
redaction · secrets via env. See `SECURITY.md`.
