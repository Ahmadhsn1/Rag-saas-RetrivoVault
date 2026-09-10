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

export interface CompGrant {
  plan: "pro" | "max" | null;
  expiresAt: string | null;
  reason?: string | null;
  grantedAt?: string | null;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: "user" | "admin";
  isRootAdmin?: boolean;
  adminSince?: string | null;
  mustChangePassword?: boolean;
  suspendedAt?: string | null;
  plan: PlanId;
  /** Plan actually in force: paid > admin comp grant > live trial > free. */
  effectivePlan: PlanId;
  /** Resolved entitlements for `effectivePlan` — gate features on these, not `plan`. */
  features: { byoKey: boolean; apiAccess: boolean; priorityQueue: boolean };
  planLimits: PlanLimits;
  trialPlan: PlanId | null;
  trialEndsAt: string | null;
  comp?: CompGrant;
  subscriptionStatus: SubscriptionStatus;
  planRenewsAt: string | null;
  hasGeminiKey: boolean;
  notificationPrefs: NotificationPrefs;
  createdAt: string;
}

export interface SessionInfo {
  id: string;
  family: string;
  device: string | null;
  ip: string | null;
  startedAt: string;
  lastSeenAt: string;
  endedAt: string | null;
  current: boolean;
  online: boolean;
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
  | "system"
  | "announcement";

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

export interface AdminHealth {
  db: "up" | "down";
  queue: Record<string, unknown>;
  features: { billing: boolean; mail: boolean; push: boolean; gemini: boolean };
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
  onlineNow: number;
  activeToday: number;
  active7d: number;
  compedUsers: number;
  suspendedUsers: number;
  admins: number;
  pushSubscribers: number;
  health: AdminHealth;
}

export interface AdminTimeseriesPoint {
  date: string;
  signups: number;
  queries: number;
  ingests: number;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  plan: PlanId;
  role: "user" | "admin";
  isRootAdmin?: boolean;
  subscriptionStatus: SubscriptionStatus;
  emailVerified: boolean;
  lockedUntil: string | null;
  trialEndsAt: string | null;
  suspendedAt?: string | null;
  comp?: CompGrant;
  online?: boolean;
  createdAt: string;
}

export interface AdminUserDetail {
  user: AdminUser & {
    notificationPrefs?: NotificationPrefs;
    suspendedReason?: string | null;
    adminSince?: string | null;
  };
  stats: { documents: number; chats: number; queries: number };
  presence: {
    online: boolean;
    openSessions: number;
    lastSeenAt: string | null;
    lastDevice: string | null;
  };
  activity: ActivityEntry[];
}

export interface AdminSession {
  id: string;
  userId: string;
  user?: { name: string; email: string };
  device: string | null;
  ip: string | null;
  startedAt: string;
  lastSeenAt: string;
  endedAt: string | null;
  endReason: string | null;
  durationMs: number;
  online: boolean;
}

export interface PresenceUser {
  userId: string;
  name: string;
  email: string;
  plan: PlanId;
  role: "user" | "admin";
  device: string | null;
  ip: string | null;
  since: string;
  lastSeenAt: string;
}

export interface AdminAuditEntry {
  _id: string;
  adminEmail: string | null;
  action: string;
  targetEmail: string | null;
  meta?: Record<string, unknown>;
  ip: string | null;
  createdAt: string;
}

export interface Broadcast {
  _id: string;
  sentByEmail: string | null;
  title: string;
  body: string;
  link: string | null;
  audience: string;
  audienceLabel: string | null;
  channels: { inApp: boolean; email: boolean; push: boolean };
  recipientCount: number;
  delivered: { inApp: number; email: number; push: number };
  status: "sending" | "sent" | "failed";
  createdAt: string;
}
