Retrivo Vault — Feature Specification (professional format):

## Authentication & User Management

- Email/password signup and login with JWT-based session handling
- Access + refresh token rotation for secure, stateless auth
- Per-user data isolation across all resources

## Document Ingestion

- Multi-format upload support (PDF, TXT)
- Automated text extraction and chunking pipeline
- Embedding generation via Gemini `text-embedding-004`
- Ingestion status tracking (`processing` / `ready` / `failed`)
- Document deletion with cascading chunk cleanup

## Knowledge Organization

- Collections/folders to categorize documents by topic or project
- Document listing and management per collection

## Retrieval & Generation

- Semantic search via MongoDB Atlas Vector Search (`$vectorSearch`)
- Context-aware answer generation using Gemini `gemini-2.5-flash`
- Source citation — every answer links back to the originating document/chunk
- Streaming responses for real-time answer rendering

## Conversation Management

- Persistent chat sessions per user
- Full conversation history, retrievable and resumable
- Session-based context (multi-turn follow-up questions)

## Platform & Reliability

- Rate limiting on ingestion and chat endpoints
- File size and MIME-type validation on upload
- Centralized error handling with no leaked stack traces
- Environment-based secrets management

## Deployment & DevOps

- Dockerized backend and frontend
- `docker-compose` for local, reproducible full-stack runs
- Cloud-deployable (Render/Railway + Vercel + Atlas)
