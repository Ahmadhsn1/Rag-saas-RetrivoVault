# Retrivo Vault — System Architecture

A production-grade, **individual-focused** Retrieval-Augmented Generation (RAG) SaaS.
Users sign up, verify their email, upload documents into a private knowledge base,
and query it through a streaming, citation-backed chat. Free / Pro / Max plans with
usage quotas, Stripe billing, personal API keys, and bring-your-own Gemini key.

> Individuals only — there are no teams, workspaces, or org roles by design.

---

## 1. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React + Vite + **TypeScript**, Tailwind, shadcn/ui (Radix), React Router, GSAP, Recharts | Fast dev, typed, accessible primitives, animation, charts |
| Backend | Node.js + Express (ESM) | REST API + SSE, middleware auth/quota |
| Database | MongoDB Atlas | Documents, vectors, users, billing state in one place |
| Vector search | MongoDB Atlas Vector Search | Native `$vectorSearch`; `userId` filter enforces isolation |
| Embeddings | Google Gemini `text-embedding-004` | 768-dim, free tier; per-user key supported |
| LLM | Google Gemini `gemini-2.5-flash` | Fast, streaming |
| Auth | JWT access + httpOnly refresh cookie; bcrypt; personal API keys (`x-api-key`) | Stateless web + programmatic access |
| Email | Nodemailer (SMTP), console fallback in dev | Verification + password reset |
| Billing | Stripe (Checkout + Customer Portal + webhooks) | Plan upgrades; disabled gracefully when unconfigured |
| Ingestion | In-process job queue (bounded concurrency, priority, retry) | Dependency-free; swappable for BullMQ + Redis |
| File parsing | `pdf-parse`, `mammoth` (DOCX), native (TXT/MD), CSV flattener | Raw text before chunking |
| Deployment | Docker + Docker Compose; CI on GitHub Actions | Reproducible, tested |

---

## 2. High-Level Flow

**Ingestion (queued, once per document):**
Upload → quota check → create `Document{status:processing}` → **enqueue** →
extract text → chunk (overlap, sentence-aware) → embed each chunk (user key or platform key)
→ insert `Chunk{ text, embedding, userId, documentId, collectionId }` → `status:ready`
→ record a `UsageEvent{kind:ingest}`. Paid plans jump the queue.

**Query (per message, SSE stream):**
Question → **query-quota check** → embed question → `$vectorSearch` filtered by `userId`
(+ optional `collectionId`) → top-k chunks → prompt + chunks + history → Gemini stream →
`sources` then `token` events → persist both turns → increment monthly counter +
`UsageEvent{kind:query}` → `done`.

---

## 3. Folder Structure

```
retrivo-vault/
├── backend/src/
│   ├── config/        env.js · db.js · gemini.js (modelsFor) · plans.js
│   ├── models/        User · Document · Chunk · Collection · ChatSession
│   │                  Token · ApiKey · UsageEvent
│   ├── middleware/     auth.js (JWT + x-api-key) · quota.js · rateLimiter.js
│   │                  upload.js · errorHandler.js
│   ├── services/       chunking · embedding · retrieval · generation
│   │                  ingestion (+ jobQueue) · usage · billing · mailer · authTokens
│   ├── controllers/    auth · account · document · collection · chat · billing · usage · apiKey
│   ├── routes/         one router per controller
│   ├── utils/          textExtractor (pdf/docx/md/csv) · ApiError
│   ├── scripts/        createVectorIndex.js
│   ├── test/           setup.js (memory-server + Gemini mock) · helpers.js
│   ├── app.js · server.js
├── frontend/src/
│   ├── lib/            api.ts · motion.ts · plans.ts · notifyApiError.ts · utils.ts
│   ├── context/        AuthContext · AppContext (collections + usage)
│   ├── hooks/          useDocuments · useCollections · useChatSessions
│   │                  useUsage · useBilling · useGsapReveal · useTypewriter
│   ├── components/
│   │   ├── ui/          shadcn primitives
│   │   ├── marketing/   Hero · BentoFeatures · RetrievalDemo · StatsBand
│   │   │               Pricing · FAQ · SecurityPanel · nav/footer · AuroraBackground
│   │   ├── auth/        AuthLayout · FormError
│   │   ├── app/         AppShell · sidebar · topbar · UploadDialog · chat/*
│   │   │               VerifyEmailBanner · settings/{Profile,Billing,ApiKeys,Account}Tab
│   │   └── rag/         PipelineStrip · CitationBadge · AnswerText · SourceDrawer · StatusChip
│   ├── pages/           marketing/{Landing,PricingPage,MarketingLayout}
│   │                  auth/{Login,Signup,ForgotPassword,ResetPassword,VerifyEmail}
│   │                  app/{Chat,Documents,Collections,Settings}
│   └── design-system/retrivo-vault/   MASTER.md + pages/*  (internal design spec output)
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## 4. Data Models (additions in **bold**)

**User** — `name, email, passwordHash, **emailVerified**, **plan** (free|pro|max),
**subscriptionStatus**, **planRenewsAt**, **stripeCustomerId**, **stripeSubscriptionId**,
**geminiApiKey** (select:false) / **hasGeminiKey**, **usage{ queriesThisPeriod, periodStart }**`

**Document** — `userId, collectionId, filename, mimeType, sizeBytes, status, chunkCount, error, uploadedAt`

**Chunk** — `userId, documentId, collectionId, order, text, embedding[768]`

**Collection** — `userId, name`

**ChatSession** — `userId, title, messages[{ role, content, citedChunkIds, createdAt }]`

**Token** — `userId, type (email_verify|password_reset), tokenHash (sha256), expiresAt, usedAt` — TTL-indexed

**ApiKey** — `userId, name, keyHash (sha256), prefix, lastUsedAt, revokedAt`

**UsageEvent** — `userId, kind (query|ingest), amount, meta, createdAt` — TTL 400d; feeds the usage chart

---

## 5. Plans & Quotas

| | Free | Pro | Max |
|---|---|---|---|
| Documents | 20 | 500 | 5,000 |
| Storage | 50 MB | 2 GB | 20 GB |
| Questions / month | 100 | 3,000 | 20,000 |
| Collections | 3 | 50 | 500 |
| Bring-your-own Gemini key | — | ✓ | ✓ |
| Priority ingestion | — | ✓ | ✓ |
| Personal API keys | — | — | up to 10 |

Enforced by `middleware/quota.js` (`enforceDocumentQuota`, `enforceCollectionQuota`,
`enforceQueryQuota`, `requireFeature`). Over-limit responses are `402` /
`403` with `details.code` = `quota_exceeded` / `feature_locked`; the frontend turns
those into an "Upgrade" toast. The monthly query window rolls forward automatically.

---

## 6. MongoDB Atlas Vector Search Index

`chunks` collection (`npm run create-index`):
```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine" },
    { "type": "filter", "path": "userId" },
    { "type": "filter", "path": "collectionId" }
  ]
}
```
The `userId` filter is what enforces **per-user isolation** on every retrieval.

---

## 7. API Endpoints

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/signup` · `/login` · `/refresh` · `/logout` | Session |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/verify-email` · `/resend-verification` | Email verification |
| POST | `/api/auth/forgot-password` · `/reset-password` | Password reset |
| DELETE | `/api/auth/account` | Delete account (password-confirmed, cascade) |
| PATCH | `/api/account/profile` | Rename |
| PUT/DELETE | `/api/account/gemini-key` | BYO Gemini key (paid) |
| POST/GET/DELETE | `/api/documents` (+`/:id`) | Upload (quota) / list / get / delete |
| POST/GET/PATCH/DELETE | `/api/collections` (+`/:id`) | CRUD (quota on create) |
| POST/GET/DELETE | `/api/chat` (+`/:id`) | Sessions |
| POST | `/api/chat/:id/message` | Ask — SSE, query quota |
| GET | `/api/usage` · `/api/usage/chart` | Snapshot + 30-day series |
| GET | `/api/billing` | Plan, status, catalog |
| POST | `/api/billing/checkout` · `/api/billing/portal` | Stripe redirects |
| POST | `/api/billing/webhook` | Stripe events → subscription sync (raw body) |
| GET/POST/DELETE | `/api/keys` (+`/:id`) | Personal API keys (Max) |
| GET | `/api/health` · `/api/health/deep` | Liveness / DB + queue + feature flags |

`/api/documents` and `/api/chat` also accept `x-api-key`.

---

## 8. Security / Production Considerations

- bcrypt (cost 12); JWT access 15 min + httpOnly refresh cookie scoped to `/api/auth`
- `helmet`; CORS with credentials + configurable origin
- Rate limiting on auth / upload / chat
- Upload MIME allowlist + size cap **before** parsing; in-memory only, never written to disk
- Every DB query scoped by `userId`; vector index carries the `userId` filter
- One-time tokens stored as SHA-256 hashes, TTL-indexed; API keys likewise
- Stripe webhook signature verified against the raw body
- Password-reset responses never reveal whether an address exists
- Centralized error handler — no stack traces to clients in production
- Secrets only via env; optional integrations degrade gracefully when unset

---

## 9. Testing & CI

- **Backend:** Vitest + `mongodb-memory-server` + `supertest`; the Gemini SDK is
  mocked. 33 tests: auth, email/reset/delete flows, quota enforcement, billing
  (disabled path + webhook signature + `syncSubscription`), API keys, ingestion
  queue end-to-end, format extraction.
- **Frontend:** Vitest + Testing Library (jsdom); GSAP + api mocked. 27 tests:
  every route renders, auth flows, chat streaming + citations, settings tabs,
  full landing render + interactive demo.
- **CI** (`.github/workflows/ci.yml`): backend `npm test`; frontend
  `typecheck` + `lint` + `test` + `build`.

---

## 10. Deployment

`docker-compose.yml` runs backend + frontend (nginx). MongoDB stays on Atlas.
Backend serves the API; nginx serves the static bundle and proxies `/api`
(SSE-friendly). Optional: `SMTP_URL` for real email, `STRIPE_SECRET_KEY` +
price IDs + `STRIPE_WEBHOOK_SECRET` for billing, `DEMO_MODE=true` for a
zero-config portfolio demo (auto-verified emails, billing stubbed).

Suggested free hosting: backend on Render/Railway, frontend on Vercel, DB on
Atlas M0.
