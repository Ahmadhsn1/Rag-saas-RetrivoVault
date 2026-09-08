import { env } from "./env.js";

// Hand-written OpenAPI 3.1 description of the public/programmatic surface.
// Served at /api/openapi.json and rendered by the frontend /docs page.
export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Retrivo Vault API",
    version: "1.0.0",
    description:
      "Programmatic access to your Retrivo Vault. Authenticate with a personal API key (Max plan) via the `x-api-key` header.",
  },
  servers: [{ url: `${env.appUrl.replace(/\/$/, "")}/api` }],
  components: {
    securitySchemes: {
      apiKey: { type: "apiKey", in: "header", name: "x-api-key" },
    },
  },
  security: [{ apiKey: [] }],
  paths: {
    "/documents": {
      get: {
        summary: "List documents",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "q", in: "query", schema: { type: "string" } },
          {
            name: "status",
            in: "query",
            schema: { enum: ["processing", "ready", "failed"] },
          },
        ],
        responses: { 200: { description: "Paginated document list" } },
      },
      post: {
        summary: "Upload a document",
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" },
                  collectionId: { type: "string" },
                },
                required: ["file"],
              },
            },
          },
        },
        responses: { 202: { description: "Queued for ingestion" } },
      },
    },
    "/documents/url": {
      post: {
        summary: "Ingest a web page by URL",
        description: "Body `{ url, collectionId? }`. Fetches an HTML / text / PDF page (https, public host, ≤ 8 MB) and runs it through the pipeline.",
        responses: { 202: { description: "Queued for ingestion" } },
      },
    },
    "/documents/{id}": {
      get: { summary: "Get one document", responses: { 200: { description: "Document" } } },
      delete: { summary: "Delete a document", responses: { 204: { description: "Deleted" } } },
    },
    "/chat": {
      get: { summary: "List chat sessions", responses: { 200: { description: "Sessions" } } },
      post: { summary: "Create a chat session", responses: { 201: { description: "Session" } } },
    },
    "/chat/{sessionId}/message": {
      post: {
        summary: "Ask a question (Server-Sent Events)",
        description:
          "Streams `sources`, `token`, `done` and `error` events. Body: `{ content, collectionId? }`.",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  content: { type: "string" },
                  collectionId: { type: "string" },
                },
                required: ["content"],
              },
            },
          },
        },
        responses: { 200: { description: "text/event-stream" } },
      },
    },
    "/collections": {
      get: { summary: "List collections", responses: { 200: { description: "Collections" } } },
      post: { summary: "Create a collection", responses: { 201: { description: "Collection" } } },
    },
    "/usage": {
      get: { summary: "Usage snapshot vs. plan limits", responses: { 200: { description: "Usage" } } },
    },
  },
  "x-webhooks": {
    "document.ready": {
      description:
        "POSTed to your configured webhook when a document finishes ingestion. Signed with HMAC-SHA256 in `x-retrivo-signature`.",
    },
    "document.failed": { description: "POSTed when ingestion fails." },
    "chat.answered": { description: "POSTed after a chat answer is generated." },
  },
};
