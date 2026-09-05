# Retrivo Vault — System Architecture

Multi-user Retrieval Augmented Generation (RAG) platform. Users register, upload documents, and query their own private knowledge base through an LLM-backed chat interface.

---

## 1. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React (Vite) + Tailwind CSS | Fast dev server, utility-first styling for polish |
| Backend | Node.js + Express | REST API, middleware-based auth |
| Database | MongoDB Atlas | Documents + vectors in one place |
| Vector Search | MongoDB Atlas Vector Search | Native `$vectorSearch` aggregation stage, no separate vector DB |
| Embeddings | Google Gemini `text-embedding-004` | Free tier, 768-dim vectors |
| LLM | Google Gemini `gemini-2.5-flash` | Free tier, fast, supports streaming |
| Auth | JWT (access + refresh tokens) | Stateless, standard for REST APIs |
| File parsing | `pdf-parse` (PDF), native read (`.txt`) | Extract raw text before chunking |
| Deployment | Docker + Docker Compose | Reproducible environment, portfolio-ready (recruiter can run it) |
| Hosting (suggested) | Render / Railway (backend), Vercel (frontend) | Free tiers available |

---

## 2. High-Level Flow

**Ingestion (once per document):**
Upload → extract text → chunk → embed each chunk → store `{ text, embedding, documentId, userId }` in MongoDB.

**Query (every time user asks something):**
User question → embed question → `$vectorSearch` against user's chunks → top-k chunks retrieved → chunks + question sent to Gemini LLM → answer streamed back with source citations.

---

## 3. Folder Structure

```
retrivo-vault/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                 # MongoDB connection
│   │   │   └── gemini.js             # Gemini client setup
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Document.js
│   │   │   ├── Chunk.js
│   │   │   └── ChatSession.js
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT verify
│   │   │   ├── errorHandler.js
│   │   │   └── rateLimiter.js
│   │   ├── services/
│   │   │   ├── chunkingService.js    # split text into chunks
│   │   │   ├── embeddingService.js   # call Gemini embedding API
│   │   │   ├── retrievalService.js   # $vectorSearch query
│   │   │   └── generationService.js  # call Gemini LLM, build prompt
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── documentController.js
│   │   │   ├── collectionController.js
│   │   │   └── chatController.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── documentRoutes.js
│   │   │   ├── collectionRoutes.js
│   │   │   └── chatRoutes.js
│   │   ├── utils/
│   │   │   └── textExtractor.js      # PDF/txt → raw text
│   │   ├── app.js                    # express app, middleware wiring
│   │   └── server.js                 # entry point
│   ├── .env
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadPanel.jsx
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── CollectionSidebar.jsx
│   │   │   └── CitationBadge.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── api/
│   │   │   └── axiosClient.js
│   │   └── App.jsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 4. Data Models

**User**
```
{
  _id, name, email, passwordHash,
  createdAt
}
```

**Document**
```
{
  _id, userId, filename, collectionId,
  status: "processing" | "ready" | "failed",
  uploadedAt
}
```

**Chunk**
```
{
  _id, userId, documentId,
  text: String,
  embedding: [Number]   // 768-dim vector, indexed for $vectorSearch
}
```

**Collection** (folder/category)
```
{
  _id, userId, name, createdAt
}
```

**ChatSession**
```
{
  _id, userId, title,
  messages: [{ role: "user"|"assistant", content, citedChunkIds, createdAt }]
}
```

---

## 5. MongoDB Atlas Vector Search Index

Created on the `chunks` collection:
```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine" },
    { "type": "filter", "path": "userId" }
  ]
}
```
The `filter` field on `userId` is what enforces **per-user isolation** — every query restricts the vector search to the requesting user's own chunks only.

---

## 6. API Endpoints

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Get JWT tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/documents` | Upload + trigger ingestion |
| GET | `/api/documents` | List user's documents |
| DELETE | `/api/documents/:id` | Remove document + its chunks |
| POST | `/api/collections` | Create a collection |
| GET | `/api/collections` | List collections |
| POST | `/api/chat/:sessionId/message` | Send a query, stream answer back |
| GET | `/api/chat` | List chat sessions |
| GET | `/api/chat/:sessionId` | Get one session's history |

---

## 7. Security / Production Considerations

- Passwords hashed with bcrypt, never stored plain
- JWT access token short-lived (15 min), refresh token longer-lived, stored httpOnly cookie
- Rate limiting on `/api/chat` and `/api/documents` (prevent abuse of Gemini free tier quota)
- File upload size limit + MIME-type validation before parsing
- Every DB query scoped by `userId` — no cross-user data leakage
- Centralized error handler — no raw stack traces sent to client
- Environment secrets (`GEMINI_API_KEY`, `MONGO_URI`, `JWT_SECRET`) only in `.env`, never committed

---

## 8. Deployment

`docker-compose.yml` runs backend + frontend as two services. MongoDB stays on Atlas (managed, not containerized). Backend Dockerfile builds Node image, frontend Dockerfile builds a static Vite bundle served via nginx.

Suggested free hosting: backend on Render/Railway, frontend on Vercel, database on Atlas free tier (M0 cluster).
