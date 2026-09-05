# Retrivo Vault

Multi-user Retrieval-Augmented Generation (RAG) platform. Users register, upload
documents (PDF / TXT), and query their own private knowledge base through an
LLM-backed chat interface with source citations.

See [`retrivo-vault-architecture.md`](./retrivo-vault-architecture.md) for the full design.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React (Vite) + Tailwind CSS + React Router |
| Backend | Node.js + Express (ESM) |
| Database | MongoDB Atlas |
| Vector search | Atlas `$vectorSearch` (768-dim, cosine) |
| Embeddings | Google Gemini `text-embedding-004` |
| LLM | Google Gemini `gemini-2.5-flash` (streamed via SSE) |
| Auth | JWT access token + httpOnly refresh cookie, bcrypt password hashing |
| Deploy | Docker + Docker Compose |

---

## Prerequisites

1. **MongoDB Atlas cluster** (M0 free tier works). Atlas is required — Vector
   Search is not available in a local `mongod`.
2. **Google Gemini API key** — https://aistudio.google.com/apikey
3. Node.js 20+ (for local dev) or Docker (for the compose setup).

---

## Local development

### Backend

```bash
cd backend
cp .env.example .env          # fill in MONGO_URI, GEMINI_API_KEY, JWT secrets
npm install
npm run create-index          # one-time: creates the Atlas Vector Search index
npm run dev                    # http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                    # http://localhost:5173 (proxies /api -> :5000)
```

---

## Docker

```bash
cp backend/.env.example backend/.env   # fill in real values
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:5000/api
- nginx in the frontend container proxies `/api` to the backend service.

Run the index creation once against your Atlas cluster:

```bash
docker compose run --rm backend npm run create-index
```

---

## Vector Search index

The `chunks` collection needs this index (created by `npm run create-index`, or
manually in the Atlas UI):

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine" },
    { "type": "filter", "path": "userId" },
    { "type": "filter", "path": "collectionId" }
  ]
}
```

The `userId` filter is what enforces **per-user isolation** — every retrieval
query restricts the vector search to the requesting user's own chunks.

---

## API

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Create account (returns access token, sets refresh cookie) |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/refresh` | Rotate tokens from the refresh cookie |
| POST | `/api/auth/logout` | Clear refresh cookie |
| GET  | `/api/auth/me` | Current user |
| POST | `/api/documents` | Upload a file, trigger async ingestion (`202`) |
| GET  | `/api/documents` | List documents (`?collectionId=`) |
| GET  | `/api/documents/:id` | One document (status) |
| DELETE | `/api/documents/:id` | Delete document + its chunks |
| POST | `/api/collections` | Create a collection |
| GET  | `/api/collections` | List collections + document counts |
| DELETE | `/api/collections/:id` | Delete collection (documents detached, not deleted) |
| POST | `/api/chat` | Create a chat session |
| GET  | `/api/chat` | List sessions |
| GET  | `/api/chat/:sessionId` | Session history |
| DELETE | `/api/chat/:sessionId` | Delete session |
| POST | `/api/chat/:sessionId/message` | Ask a question — **SSE stream** (`sources`, `token`, `done`, `error` events) |

---

## Ingestion pipeline

`upload → extract text (pdf-parse / utf-8) → chunk (overlapping, sentence-aware)
→ embed each chunk (Gemini) → insert { text, embedding, userId, documentId }`

Ingestion runs in the background after the upload response; the client polls
`GET /api/documents` and watches `status`: `processing → ready | failed`.

## Query pipeline

`question → embed → $vectorSearch (filtered by userId) → top-k chunks →
prompt + chunks → Gemini stream → answer with [n] citations → persist both turns`

---

## Security notes

- Passwords hashed with bcrypt (cost 12), never stored plaintext.
- Access token 15 min; refresh token 7 days in an httpOnly, SameSite cookie
  scoped to `/api/auth`.
- Rate limiting on auth, upload, and chat routes (protects Gemini free-tier quota).
- Upload size limit + MIME allowlist (`application/pdf`, `text/plain`) before parsing.
- Every DB query scoped by `userId` — no cross-user data access.
- Centralized error handler — no stack traces sent to clients in production.
- Secrets only via `.env` (git-ignored).
