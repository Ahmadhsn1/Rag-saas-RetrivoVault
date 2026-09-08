# Security

This is a portfolio project, not a hosted service. If you deploy it, you are the
operator. Reports of issues in the code are welcome via a GitHub issue.

## What the code does

- Passwords: bcrypt cost 12; never logged or returned.
- Access tokens: JWT, 15-minute TTL, sent as a bearer header (kept in memory client-side).
- Refresh tokens: opaque, SHA-256-hashed at rest, **rotated on every use**, grouped
  into a `family`; replaying a rotated token revokes the whole family. Logout and
  password reset revoke sessions server-side.
- Login: per-account lockout after 8 failed attempts (15 min), plus IP rate limiting.
- One-time tokens (email verify / password reset) and API keys are stored only as
  SHA-256 hashes and are TTL-indexed.
- Every database query is scoped by `userId`; the Atlas vector index carries a
  `userId` filter so retrieval can never cross accounts.
- Uploads: MIME allowlist + size cap enforced before parsing; files are held in
  memory and never written to disk.
- Stripe webhooks are verified against the raw request body.
- `helmet`, credentialed CORS with a configurable origin, centralized error handling
  that never returns stack traces in production.
- Secrets come from the environment; optional integrations (Stripe, SMTP) are
  disabled cleanly when unset.

## Operator responsibilities

- Set strong, unique `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` in production.
- Put the API behind HTTPS (the refresh cookie is `Secure` + `SameSite=None` in prod).
- The in-memory rate-limit store resets on restart and is per-instance — use a
  shared store (e.g. `rate-limit-redis`) if you run more than one instance.
- Rotate the Gemini and Stripe keys if they leak.
