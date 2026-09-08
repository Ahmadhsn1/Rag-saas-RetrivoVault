# Retrivo Vault

A production-grade, **individual-focused** Retrieval-Augmented Generation (RAG) SaaS.
Sign up, verify your email, upload documents (PDF · TXT · Markdown · DOCX · CSV) into a
private knowledge base, and query it through a streaming, citation-backed chat.
Free / Pro / Max plans with usage quotas, Stripe billing, personal API keys, and
bring-your-own Gemini key.

> Individuals only — no teams, workspaces, or org roles, by design.

See [`retrivo-vault-architecture.md`](./retrivo-vault-architecture.md) for the full design
and [`features.md`](./features.md) for the feature list.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + **TypeScript**, Tailwind, shadcn/ui (Radix), React Router, GSAP, Recharts |
| Design system | `frontend/design-system/retrivo-vault/` — `internal design spec` skill output, refined against the covis.ai reference. Dark, JetBrains Mono + IBM Plex Sans. |
| Backend | Node.js + Express (ESM), SSE streaming |
| Database | MongoDB Atlas + Atlas Vector Search (`$vectorSearch`, 768-dim cosine) |
| AI | Google Gemini `text-embedding-004` + `gemini-2.5-flash` |
| Auth | JWT access + httpOnly refresh cookie · bcrypt · personal API keys (`x-api-key`) |
| Email | Nodemailer (SMTP; console fallback in dev) |
| Billing | Stripe Checkout + Customer Portal + webhooks (degrades gracefully when unset) |
| Ingestion | In-process job queue (concurrency, priority, retry) |
| Tests / CI | Vitest (60 tests) · GitHub Actions |
| Deploy | Docker + Docker Compose |

---

## Prerequisites

1. **MongoDB Atlas cluster** (M0 free tier works) — Vector Search is Atlas-only.
2. **Google Gemini API key** — https://aistudio.google.com/apikey
3. Node.js 20+ (local dev) or Docker.
4. *(optional)* Stripe test keys for billing; an SMTP URL for real email.

---

## Quick start

```bash
# backend
cd backend
npm install
npm run dev                 # http://localhost:5000  — works with ZERO config

# frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173  (proxies /api -> :5000)
```

**Zero-config dev:** with no `backend/.env`, `npm run dev` starts an **ephemeral
in-memory MongoDB** and runs in demo mode (emails auto-verified, billing stubbed).
Every endpoint works except **vector retrieval** (needs Atlas) and **AI calls**
(need a Gemini key) — you'll get a clear `502` there until you configure them.

**Real setup:** `cp .env.example .env`, fill in `MONGO_URI` (a MongoDB **Atlas**
cluster — Vector Search is Atlas-only), `GEMINI_API_KEY`, and JWT secrets, then:

```bash
cd backend && npm run create-index   # one-time: Atlas Vector Search index
```

**Checks:** `npm test` (backend, 33) · `npm test && npm run typecheck && npm run lint && npm run build` (frontend, 27).

### Routes

`/` landing · `/pricing` · `/login` · `/signup` · `/forgot-password` ·
`/reset-password` · `/verify-email` · `/app` (Chat) · `/app/documents` ·
`/app/collections` · `/app/settings` (`?tab=profile|billing|keys|account`).

---

## Docker

```bash
cp backend/.env.example backend/.env      # fill in real values
docker compose up --build
docker compose run --rm backend npm run create-index   # once
```

- App: http://localhost:8080  ·  API: http://localhost:5000/api
- nginx serves the static bundle and proxies `/api` (SSE-friendly).

---

## Plans & quotas

| | Free | Pro | Max |
|---|---|---|---|
| Documents · storage | 20 · 50 MB | 500 · 2 GB | 5,000 · 20 GB |
| Questions / month | 100 | 3,000 | 20,000 |
| Collections | 3 | 50 | 500 |
| BYO Gemini key · priority queue | — | ✓ | ✓ |
| Personal API keys | — | — | up to 10 |

Over-limit requests return `402`/`403` with `details.code` (`quota_exceeded` /
`feature_locked`); the UI turns these into an "Upgrade" prompt.

---

## Stripe (optional)

Set in `backend/.env`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and the four
price IDs (`STRIPE_PRICE_{PRO,MAX}_{MONTHLY,ANNUAL}`). Locally:

```bash
stripe listen --forward-to localhost:8080/api/billing/webhook
```

Without a secret key, billing endpoints report `billingEnabled:false` and everyone
stays on Free.

---

## API

Auth: `POST /api/auth/{signup,login,refresh,logout,verify-email,resend-verification,
forgot-password,reset-password}` · `GET /api/auth/me` · `DELETE /api/auth/account`
Account: `PATCH /api/account/profile` · `PUT|DELETE /api/account/gemini-key`
Documents: `POST|GET /api/documents` · `GET|DELETE /api/documents/:id`  *(upload is quota-checked, returns `202`)*
Collections: `POST|GET /api/collections` · `PATCH|DELETE /api/collections/:id`
Chat: `POST|GET /api/chat` · `GET|DELETE /api/chat/:id` · `POST /api/chat/:id/message` *(SSE: `sources`, `token`, `done`, `error`)*
Usage: `GET /api/usage` · `GET /api/usage/chart`
Billing: `GET /api/billing` · `POST /api/billing/{checkout,portal}` · `POST /api/billing/webhook`
Keys: `GET|POST /api/keys` · `DELETE /api/keys/:id`
Health: `GET /api/health` · `GET /api/health/deep`

`/api/documents` and `/api/chat` also accept an `x-api-key` header (Max plan keys).

---

## Security

bcrypt (cost 12) · JWT access 15m + httpOnly refresh cookie · `helmet` · credentialed
CORS · rate limiting (auth/upload/chat) · MIME + size checks before parsing, in-memory
only · every query scoped by `userId` (vector index included) · one-time tokens & API
keys stored as SHA-256 hashes, TTL-indexed · Stripe webhook signature verified against
the raw body · no user enumeration on password reset · no stack traces to clients in
production · secrets via env, optional integrations degrade gracefully.
