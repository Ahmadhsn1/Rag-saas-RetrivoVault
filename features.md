Retrivo Vault — Feature Specification

An individual-focused RAG SaaS: a private, cited knowledge base for one person.
(No teams, workspaces, or org roles — by design.)

## Authentication & Account

- Email/password signup and login with JWT access + httpOnly refresh cookie
- **Rotating** refresh tokens with reuse detection (replay → whole session family revoked)
- Server-side revocation: logout, "sign out everywhere", password reset, account deletion
- Per-account login lockout after repeated failures (on top of IP rate limiting)
- Silent session restore on load (single-flighted)
- Email verification (one-time hashed token, 24h) with in-app resend + banner
- Password reset (one-time hashed token, 1h; no user enumeration; revokes sessions)
- Profile editing; **full JSON data export**; account deletion (password-confirmed, cascade)
- Per-user **activity log** (Settings → Activity)
- Per-user data isolation across every resource and the vector index

## Document Ingestion

- Upload PDF, TXT, Markdown, DOCX, CSV (≤ 10 MB), optionally into a collection
- Background job queue: bounded concurrency, retry with backoff, priority for paid
  plans, backpressure (503 when full), stuck-job sweep on restart
- Text extraction → overlapping sentence-aware chunking → Gemini embeddings (768-dim)
- **Content-hash dedup** — re-uploading an identical file copies chunks, skips re-embedding
- **AI document summary + 3 suggested starter questions** generated on ingest
- Input caps: extracted-text length, chunks-per-document (decompression-bomb safe)
- Status tracking (processing / ready / failed); document detail drawer
- Search + status filter + pagination on the documents list
- Document deletion with cascading chunk cleanup

## Knowledge Organisation

- Collections to group documents by topic or project
- **Per-collection custom instructions** injected into the prompt (a persona / rules)
- Scope a chat to one collection so retrieval stays on-subject
- Rename / delete collections (documents are detached, not destroyed)

## Retrieval & Generation

- Semantic search via MongoDB Atlas `$vectorSearch` (cosine, top-k, `userId`-filtered)
- Grounded answer generation with `gemini-2.5-flash`; refuses when context is insufficient
- Inline `[n]` citations → hover preview → click opens the source passage + score
- Token-by-token streaming over SSE; **stop generation**; retry a failed answer
- **Message feedback** (👍 / 👎); copy answer
- Persistent, resumable multi-turn sessions; pin / archive / rename
- **Public read-only share links** for a conversation (`/s/:id`, revocable)
- AI-suggested questions on the empty state and per document

## Plans, Billing & Usage

- **14-day Pro trial** on every signup (no card); then Free forever or upgrade
- Free / Pro / Max plans (individual pricing, monthly or −25% annual)
- Quota enforcement respecting the live trial: documents, storage, questions/month, collections
- Usage metering: monthly rolling window + 30-day activity time-series
- In-app usage bars, activity chart (with data-table view), plan comparison
- Stripe Checkout + Customer Portal + signed webhooks → subscription sync
- Graceful degradation: with no Stripe key, everyone stays on Free and upgrades are hidden

## Notifications

- In-app notification centre (bell menu, unread badge, deep links)
- Preference-aware email: document processed / failed, quota at 85%, trial ending
- Per-channel toggles in Settings → Notifications
- 6-hour in-process scheduler for trial + quota nudges

## Developer Platform

- Personal API keys (Max plan) — hashed at rest, shown once, `x-api-key` header
- **Personal webhooks** (Max): `document.ready` / `document.failed` / `chat.answered`,
  HMAC-SHA256 signed, retried, auto-disabled after repeated failures, SSRF-protected
- **OpenAPI 3.1 spec** at `/api/openapi.json`, rendered at `/docs`
- Bring-your-own Google Gemini key (Pro/Max) — requests run against your own quota

## Admin

- `/app/admin` (via `ADMIN_EMAILS` or role): user count, plan mix, MRR estimate,
  30-day query volume, searchable user table, grant/downgrade plan, unlock account

## Platform & Reliability

- `helmet`, credentialed CORS, structured logging (pino) with secret redaction
- **NoSQL-injection defense** — request sanitizer strips `$`/dotted keys; string coercion
- Rate limiting on auth / refresh / upload / chat
- File size + MIME validation before parsing; in-memory handling only
- Centralized error handler maps every framework error to a 4xx (no 500 on bad input)
- Transient upstream errors (429/503/timeout) retried with exponential backoff + jitter
- Deep health check (DB + queue + feature flags); environment-based secrets
- Zero-config local dev (`npm run dev` with no `.env` → in-memory Mongo + demo mode)

## Frontend Experience

- Marketing site: animated hero, bento features, interactive retrieval demo,
  animated stats, pricing, FAQ, API docs — dark, monospace-accented, motion-respecting
- App: collapsible sidebar shell, ⌘K command palette, streaming chat with source
  drawer, documents table with drag-drop upload + detail drawer, collections grid,
  seven-tab settings, guided onboarding, notification bell, trial banner
- Error boundary + real 404 page; per-route `<title>`/OG meta; favicon
- Fully responsive (375 → 1440), keyboard-navigable, `prefers-reduced-motion` honoured

## Testing & DevOps

- ~112 automated tests (~78 backend, ~34 frontend), incl. adversarial/hardening suites
- Backend: Vitest + mongodb-memory-server + supertest (Gemini mocked)
- Frontend: Vitest + Testing Library (jsdom); render, error-boundary and 404 coverage
- GitHub Actions CI (mongo binary cached); hardened Dockerfiles (npm ci, non-root,
  healthchecks); `docker-compose` for local runs
- Cloud-deployable (Render/Railway + Vercel + Atlas)
