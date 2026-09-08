# Retrivo Vault — System Architecture

A production-grade, **individual-focused** Retrieval-Augmented Generation (RAG) SaaS.
Sign up (14-day Pro trial, no card), verify email, upload documents (PDF/TXT/MD/DOCX/CSV)
into a private knowledge base, and query it through a streaming, citation-backed chat
with feedback, sharing and an ⌘K palette. Free / Pro / Max plans with trial-aware
quotas, Stripe billing, in-app + email notifications, an activity log + data export,
personal API keys, HMAC-signed webhooks, an OpenAPI spec, and a lightweight admin
console.

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
│   └── design-system/retrivo-vault/   MASTER.md + pages/*  (design spec)
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## 4. Data Models

**User** — `name, email, passwordHash, emailVerified, role (user|admin), plan (free|pro|max),
trialPlan / trialEndsAt (14-day Pro trial), subscriptionStatus, planRenewsAt,
stripeCustomerId, stripeSubscriptionId, geminiApiKey (select:false) / hasGeminiKey,
usage{ queriesThisPeriod, periodStart }, notificationPrefs{…}, failedLoginAttempts, lockedUntil`
— `effectivePlan()` = paid > live trial > free.

**Document** — `userId, collectionId, filename, mimeType, sizeBytes, contentHash, sourceUrl,
summary, suggestedQuestions[], status, chunkCount, error, uploadedAt`

**Chunk** — `userId, documentId, collectionId, order, text, embedding[768]`

**Collection** — `userId, name, instructions` (persona prepended to the prompt)

**ChatSession** — `userId, title, collectionId, pinned, archived, shareId, messages[{ _id,
role, content, citedChunkIds, sources, feedback }]`

**Token** / **RefreshToken** / **ApiKey** — SHA-256-hashed secrets, TTL-indexed

**Notification** — `userId, type, title, body, link, readAt` — TTL 90d

**ActivityLog** — `userId, action, detail, ip, userAgent` — TTL 180d, append-only

**Webhook** — `userId, url, events[], secret (HMAC), active, lastStatus, failureCount`

**UsageEvent** — `userId, kind (query|ingest), amount, meta` — TTL 400d; feeds the usage chart

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
| PATCH | `/api/chat/:id` | Rename / pin / archive |
| POST | `/api/chat/:id/share` | Enable/disable a public share link |
| POST | `/api/chat/:id/messages/:mid/feedback` | 👍/👎 an answer |
| GET | `/api/public/shared-chats/:shareId` | Read a shared chat (**no auth**) |
| GET | `/api/public/openapi.json` | OpenAPI 3.1 spec (**no auth**) |
| GET/POST/DELETE | `/api/keys` (+`/:id`) | Personal API keys (Max) |
| GET/POST/PATCH/DELETE | `/api/webhooks` (+`/:id`) | Personal webhooks (Max), HMAC-signed |
| GET/POST/DELETE | `/api/notifications` (+`/read`, `/:id`) | Notification centre |
| GET | `/api/account/activity` · `/api/account/export` | Audit log · full data export |
| PATCH | `/api/account/notification-prefs` | Email preference toggles |
| GET/PATCH | `/api/admin/{stats,users}` (+`/users/:id`) | Admin dashboard (role / `ADMIN_EMAILS`) |
| GET | `/api/health` · `/api/health/deep` | Liveness / DB + queue + feature flags |

`/api/documents` and `/api/chat` also accept `x-api-key`.

---

## 8. Security / Production Considerations

- bcrypt (cost 12); JWT access 15 min (bearer) + opaque **rotating** refresh token
  in an httpOnly cookie scoped to `/api/auth`
- Refresh tokens: SHA-256-hashed, `family`-grouped, rotated every use; a replayed
  rotated token (past a 15s retry grace) revokes the whole family. Logout / password
  reset / delete-account revoke sessions server-side (`RefreshToken` model)
- Login: per-account lockout after 8 failures (15 min) + IP rate limiting
- `helmet`; CORS with credentials + configurable origin
- Rate limiting on auth / refresh / upload / chat (no-op under test)
- Upload MIME allowlist + size cap **before** parsing; in-memory only, never written to disk
- Every DB query scoped by `userId`; vector index carries the `userId` filter
- One-time tokens + API keys stored as SHA-256 hashes, TTL-indexed
- Transient upstream errors (429/503/timeout) retried with exponential backoff + jitter
- Stripe webhook signature verified against the raw body
- Password-reset responses never reveal whether an address exists
- Centralized error handler maps every framework error (malformed JSON, CastError,
  multer, JWT, payload-too-large) to a 4xx — no 500 on bad input; bails cleanly if
  a response already streamed (SSE)
- **NoSQL-injection defense**: `mongoSanitize` strips `$`/dotted keys; `str()`
  coercion + `asId()` validation on every user string/id before Mongo
- Webhook URLs: https-only, private/loopback/metadata hosts blocked (SSRF), delivery
  uses `redirect: error`
- Ingestion input caps: extracted-text length, chunks-per-document, queue depth
  (503 backpressure) — decompression-bomb / RAM-exhaustion safe
- Structured logging (pino) with secret redaction; operational 5xx logged at `warn`
- Secrets only via env; optional integrations degrade gracefully when unset
- Zero-config dev: no `.env` → ephemeral in-memory MongoDB + demo mode (`env.autoMongo`)

---

## 9. Testing & CI

- **Backend (~78 tests):** Vitest + `mongodb-memory-server` + `supertest`; the
  Gemini SDK is mocked. Covers auth + refresh-token rotation/reuse + login lockout,
  email/reset/delete flows, quota enforcement (trial-aware), billing, API keys,
  webhooks + SSRF, notifications, chat feedback/share/pin, collection instructions,
  admin, activity/export, ingestion end-to-end + input caps, plus two **adversarial
  hardening suites** (malformed input never 500s, cross-user isolation, injection).
- **Frontend (~34 tests):** Vitest + Testing Library (jsdom); GSAP + api mocked.
  Every route renders (incl. 404, error boundary, /docs, /s/:id, /app/admin), auth
  + password flows, chat streaming + citations, settings tabs, full landing.
- **CI** (`.github/workflows/ci.yml`): backend `npm test` (mongo binary cached);
  frontend `typecheck` + `lint` + `test` + `build`.

---

## 10. Deployment

`docker-compose.yml` runs backend + frontend (nginx). MongoDB stays on Atlas.
Backend serves the API; nginx serves the static bundle and proxies `/api`
(SSE-friendly). Optional: `SMTP_URL` for real email, `STRIPE_SECRET_KEY` +
price IDs + `STRIPE_WEBHOOK_SECRET` for billing, `DEMO_MODE=true` for a
zero-config portfolio demo (auto-verified emails, billing stubbed).

Suggested free hosting: backend on Render/Railway, frontend on Vercel, DB on
Atlas M0.
