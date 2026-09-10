# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Admin console, rebuilt as a tabbed operations dashboard (Overview, Users,
  Presence, Broadcasts, Audit):
  - **Root administrator** provisioned per deployment from `ADMIN_EMAIL` /
    `ADMIN_PASSWORD` at boot, or `npm run seed:admin` (also rotates the password).
    No credentials ship in the repo. The root account is protected from
    suspension, demotion and deletion; the root admin can promote/demote other
    admins.
  - **Complimentary access grants** — give any user Pro/Max for free, with an
    optional expiry and reason. `effectivePlan()` now resolves
    paid → comp → trial → free, so quotas honour grants automatically.
  - **Live presence** — a client heartbeat records `UserSession` rows; the
    console shows who's online now and per-user session history with durations,
    device and IP. Users get a matching "active devices" list in Settings with
    per-device sign-out.
  - **Admin password reset** — email a reset link, or issue a one-time temporary
    password (shown once) that forces a change on next sign-in.
  - **Broadcasts** — send an announcement to an audience (everyone, a plan,
    comped, online now, active-7d, or one user) over in-app, email and Web Push,
    with a live recipient count and delivery history.
  - Suspend / reinstate users, force sign-out everywhere, and an immutable
    admin audit log of every privileged action.
  - Dashboard metrics: online now, DAU/WAU, comped and suspended counts, push
    subscribers, 30-day signup/query sparklines, and a system-health panel.
- Web Push notifications (VAPID + service worker), opt-in per device from
  Settings. Disabled gracefully when `VAPID_*` keys are unset.
- Authenticated **change-password** endpoint and Settings card (was previously
  only possible via the emailed reset flow).
- Login and token refresh now refuse suspended accounts.
- Retry a failed document from the Documents list — re-ingests URL-sourced docs
  in place; prompts a re-upload for files (raw bytes aren't retained).
- Create a collection inline from the upload dialog.

### Changed

- Gemini model defaults now track Google's rolling aliases — `gemini-flash-latest`
  for generation, `gemini-embedding-001` (truncated + L2-normalized to 768 dims)
  for embeddings. The previously pinned `gemini-2.5-flash` / `text-embedding-004`
  had been retired by Google and were causing every ingestion to fail.

### Fixed

- Plan-gated features (bring-your-own Gemini key, API keys, webhooks) are now
  resolved from the server-computed **effective plan**, so a 14-day trial or an
  admin complimentary grant unlocks them — previously they checked only the
  stored `plan` field and stayed locked during a trial. The user payload now
  carries `effectivePlan`, `features`, and `planLimits`.

## [1.0.0] - 2026-09-09

### Added

- Auth: rotating refresh tokens with reuse detection, login lockout, email
  verification, password reset, account deletion + data export.
- RAG pipeline: 6 input types (PDF, TXT, Markdown, DOCX, CSV, web pages by URL),
  queued ingestion with dedup, AI-generated summaries + suggested questions,
  per-collection instructions.
- Streaming chat (SSE) with citations, feedback, stop, share links, pin/archive,
  and a ⌘K command palette.
- Plans: Free / Pro / Max with a 14-day Pro trial, trial-aware quotas, Stripe
  Checkout + Customer Portal billing, usage metering and charts.
- Notifications (in-app + email preferences) with a 6-hour scheduler, plus an
  activity log.
- Developer platform: personal API keys, HMAC-signed webhooks (SSRF-guarded),
  OpenAPI spec served at `/api/public/openapi.json` and rendered at `/docs`.
- Admin console gated by `ADMIN_EMAILS`.
- Hardening: NoSQL-injection sanitizer, consistent 4xx mapping for framework
  errors, input caps across ingestion and chat, adversarial test suites.
- ~115 automated tests (Vitest, backend + frontend), GitHub Actions CI,
  hardened Docker + Docker Compose setup, zero-config `npm run dev`.

[1.0.0]: https://github.com/Ahmadhsn1/Rag-saas-RetrivoVault/releases/tag/v1.0.0
