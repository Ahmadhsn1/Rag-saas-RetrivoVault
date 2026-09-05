export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

export type DocumentStatus = "processing" | "ready" | "failed";

export interface VaultDocument {
  _id: string;
  userId: string;
  collectionId: string | null;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  chunkCount: number;
  error: string | null;
  uploadedAt: string;
  updatedAt: string;
}

export interface Collection {
  _id: string;
  userId: string;
  name: string;
  createdAt: string;
  documentCount?: number;
}

export interface RetrievedSource {
  index: number;
  chunkId: string;
  documentId: string;
  score: number;
  preview: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citedChunkIds?: string[];
  sources?: RetrievedSource[];
  createdAt?: string;
}

export interface ChatSessionSummary {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSession extends ChatSessionSummary {
  userId: string;
  messages: ChatMessage[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface ApiErrorBody {
  error: string;
  details?: unknown;
}
