export type PlanId = "free" | "pro" | "max";

export type SubscriptionStatus =
  | "none"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "unpaid";

export interface NotificationPrefs {
  ingestComplete: boolean;
  quotaWarnings: boolean;
  weeklyDigest: boolean;
  productUpdates: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: "user" | "admin";
  plan: PlanId;
  trialPlan: PlanId | null;
  trialEndsAt: string | null;
  subscriptionStatus: SubscriptionStatus;
  planRenewsAt: string | null;
  hasGeminiKey: boolean;
  notificationPrefs: NotificationPrefs;
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
  trial: { plan: PlanId; endsAt: string } | null;
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
  summary: string | null;
  suggestedQuestions: string[];
  sourceUrl: string | null;
  uploadedAt: string;
  updatedAt: string;
}

export interface Collection {
  _id: string;
  userId: string;
  name: string;
  instructions?: string;
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
  _id?: string;
  role: "user" | "assistant";
  content: string;
  citedChunkIds?: string[];
  sources?: RetrievedSource[];
  feedback?: "up" | "down" | null;
  createdAt?: string;
}

export interface ChatSessionSummary {
  _id: string;
  title: string;
  pinned?: boolean;
  archived?: boolean;
  collectionId?: string | null;
  shareId?: string | null;
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

export type NotificationType =
  | "ingest_complete"
  | "ingest_failed"
  | "quota_warning"
  | "trial_ending"
  | "plan_changed"
  | "welcome"
  | "system";

export interface AppNotification {
  _id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface Webhook {
  _id: string;
  url: string;
  events: string[];
  active: boolean;
  lastStatus: number | null;
  lastDeliveryAt: string | null;
  failureCount: number;
  createdAt: string;
}

export interface ActivityEntry {
  _id: string;
  action: string;
  detail: string;
  ip: string | null;
  createdAt: string;
}

export interface AdminStats {
  users: number;
  documents: number;
  chats: number;
  queriesLast30d: number;
  newUsersLast30d: number;
  planCounts: Record<string, number>;
  estimatedMrr: number;
  plans: string[];
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  plan: PlanId;
  role: "user" | "admin";
  subscriptionStatus: SubscriptionStatus;
  emailVerified: boolean;
  lockedUntil: string | null;
  trialEndsAt: string | null;
  createdAt: string;
}
