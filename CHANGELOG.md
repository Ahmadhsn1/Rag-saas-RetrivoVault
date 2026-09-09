# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
