# Contributing

Thanks for considering a contribution to Retrivo Vault. This is a solo-maintained
project, so please keep PRs focused and give a little time for review.

## Ground rules

- **No teams/workspaces/orgs.** Retrivo Vault is individual-focused by design — see
  `DEVELOPMENT.md`. Feature requests that add multi-user/org concepts will be declined.
- Match the existing style: ESM on the backend, TypeScript + functional components on
  the frontend, dark developer-tool aesthetic on anything UI-facing.
- Add or update tests for behavior you change (`backend/` uses Vitest +
  `mongodb-memory-server`; `frontend/` uses Vitest + Testing Library).

## Getting set up

See [`README.md`](./README.md) → **Quick start** and **Docker** for local setup, and
`.env.example` in `backend/` and `frontend/` for required/optional environment
variables.

## Workflow

1. Fork the repo and create a branch off `main`.
2. Make your change, keeping commits small and messages descriptive.
3. Run the relevant test suite(s) locally:
   ```bash
   cd backend && npm test
   cd frontend && npm run typecheck && npm run lint && npm test
   ```
4. Open a pull request describing what changed and why. Link any related issue.
5. CI (`.github/workflows/ci.yml`) must pass before merge.

## Reporting bugs

Open a GitHub issue with steps to reproduce, expected vs. actual behavior, and
relevant logs/screenshots. For security issues, follow [`SECURITY.md`](./SECURITY.md)
instead of opening a public issue.

## Proposing features

Open an issue first for anything non-trivial so we can agree on scope before you
put in the work.
