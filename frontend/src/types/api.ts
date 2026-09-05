export type PlanId = "free" | "pro" | "max";

export type SubscriptionStatus =
  | "none"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "unpaid";

export interface User {
  _id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  plan: PlanId;
  subscriptionStatus: SubscriptionStatus;
  planRenewsAt: string | null;
  hasGeminiKey: boolean;
  createdAt: string;
}

export interface PlanLimits {
  documents: number;
  storageBytes: number;
  queriesPerMonth: number;
  collections: number;
  apiKeys: number;
}

export interface UsageSnapshot {
  plan: PlanId;
  limits: PlanLimits;
  current: {
    documents: number;
    storageBytes: number;
    collections: number;
    queries: number;
  };
  remaining: {
    documents: number;
    storageBytes: number;
    collections: number;
    queries: number;
  };
  periodStart: string;
}

export interface UsagePoint {
  date: string;
  query: number;
  ingest: number;
}

export interface BillingInfo {
  billingEnabled: boolean;
  plan: {
    id: PlanId;
    name: string;
    limits: PlanLimits;
    features: { byoKey: boolean; apiAccess: boolean; priorityQueue: boolean };
  };
  subscriptionStatus: SubscriptionStatus;
  planRenewsAt: string | null;
  hasBillingAccount: boolean;
  catalog: {
    id: PlanId;
    name: string;
    limits: PlanLimits;
    prices: { monthly?: string; annual?: string } | null;
  }[];
}

export interface ApiKey {
  _id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
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
