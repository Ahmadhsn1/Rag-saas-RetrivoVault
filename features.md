Retrivo Vault — Feature Specification

An individual-focused RAG SaaS: a private, cited knowledge base for one person.
(No teams, workspaces, or org roles — by design.)

## Authentication & Account

- Email/password signup and login with JWT access + httpOnly refresh cookie
- Access + refresh token rotation; silent restore on load
- Email verification (one-time hashed token, 24h) with in-app resend + banner
- Password reset (one-time hashed token, 1h; no user enumeration)
- Profile editing; account deletion (password-confirmed, cascades every resource)
- Per-user data isolation across every resource and the vector index

## Document Ingestion

- Upload PDF, TXT, Markdown, DOCX, CSV (≤ 10 MB), optionally into a collection
- Background job queue: bounded concurrency, retry with backoff, priority for paid plans
- Text extraction → overlapping sentence-aware chunking → Gemini embeddings (768-dim)
- Status tracking (processing / ready / failed); stuck-job sweep on restart
- Document deletion with cascading chunk cleanup

## Knowledge Organisation

- Collections to group documents by topic or project
- Scope a chat to one collection so retrieval stays on-subject
- Rename / delete collections (documents are detached, not destroyed)

## Retrieval & Generation

- Semantic search via MongoDB Atlas `$vectorSearch` (cosine, top-k, `userId`-filtered)
- Grounded answer generation with `gemini-2.5-flash`; refuses when context is insufficient
- Inline `[n]` citations → hover preview → click opens the source passage + similarity score
- Token-by-token streaming over SSE; persistent, resumable multi-turn sessions

## Plans, Billing & Usage

- Free / Pro / Max plans (individual pricing, monthly or −25% annual)
- Quota enforcement: documents, storage, questions/month, collections
- Usage metering: monthly rolling window + 30-day activity time-series
- In-app usage bars, activity chart (with data-table view), plan comparison
- Stripe Checkout + Customer Portal + signed webhooks → subscription sync
- Graceful degradation: with no Stripe key, everyone stays on Free and upgrades are hidden

## Developer Features

- Personal API keys (Max plan) — hashed at rest, shown once, usable via `x-api-key`
- Bring-your-own Google Gemini key (Pro/Max) — requests run against your own quota

## Platform & Reliability

- Rate limiting on auth / ingestion / chat
- File size + MIME-type validation before parsing; in-memory handling only
- `helmet`, credentialed CORS, centralized error handling (no leaked stack traces)
- Deep health check (DB + queue + feature flags); environment-based secrets
- Quota/feature errors carry machine-readable codes → actionable "Upgrade" prompts

## Frontend Experience

- Marketing site: animated hero, bento features, interactive retrieval demo,
  animated stats, pricing, FAQ — dark, monospace-accented, motion-respecting
- App: collapsible sidebar shell, streaming chat with source drawer, documents
  table with drag-drop upload, collections grid, tabbed settings
- Fully responsive (375 → 1440), keyboard-navigable, `prefers-reduced-motion` honoured

## Testing & DevOps

- 60 automated tests (33 backend, 27 frontend)
- Backend: Vitest + mongodb-memory-server + supertest (Gemini mocked)
- Frontend: Vitest + Testing Library (jsdom)
- GitHub Actions CI; Dockerised backend + frontend; `docker-compose` for local runs
- Cloud-deployable (Render/Railway + Vercel + Atlas)
