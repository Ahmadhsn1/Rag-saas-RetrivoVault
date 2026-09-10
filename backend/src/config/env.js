import crypto from "node:crypto";
import dotenv from "dotenv";

dotenv.config();

const isTest = process.env.NODE_ENV === "test";
const isProdEnv = process.env.NODE_ENV === "production";

// Values copied straight from .env.example — treat as "not set".
const PLACEHOLDERS = [
  "mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/retrivo_vault",
  "replace_with_long_random_string",
  "replace_with_another_long_random_string",
  "your_gemini_api_key",
];

function clean(key) {
  const v = process.env[key];
  if (!v || PLACEHOLDERS.includes(v.trim())) return undefined;
  return v;
}

/**
 * Required in production; in dev/test we fall back to a generated value so the
 * server can still boot (see `env.autoMongo` / `env.geminiConfigured`).
 */
function required(key, devFallback) {
  const v = clean(key);
  if (v) return v;
  if (isProdEnv) throw new Error(`Missing required environment variable: ${key}`);
  return devFallback ?? `dev-${key.toLowerCase()}`;
}

function optional(key, fallback = undefined) {
  return clean(key) || fallback;
}

const mongoUri = clean("MONGO_URI");

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  appUrl: process.env.APP_URL || "http://localhost:5173",

  // null in dev when unset -> server.js starts an in-memory MongoDB instead.
  mongoUri: mongoUri ?? null,
  autoMongo: !mongoUri && !isProdEnv && !isTest,

  jwt: {
    accessSecret: required(
      "JWT_ACCESS_SECRET",
      isTest ? "test-access" : crypto.randomBytes(32).toString("hex")
    ),
    refreshSecret: required(
      "JWT_REFRESH_SECRET",
      isTest ? "test-refresh" : crypto.randomBytes(32).toString("hex")
    ),
    accessTtl: process.env.JWT_ACCESS_TTL || "15m",
    refreshTtl: process.env.JWT_REFRESH_TTL || "7d",
  },

  gemini: {
    apiKey: clean("GEMINI_API_KEY") || "unset",
    // Defaults deliberately track Google's rolling aliases / GA model, not a
    // pinned version — Google retires dated model names (`gemini-2.5-flash`,
    // `text-embedding-004`) and a hard-coded one eventually 404s. Override per
    // deployment only if you need to pin.
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
    // `gemini-embedding-001` returns 3072 dims by default; the vector index and
    // Chunk schema are 768, so we always request a truncated 768-dim vector.
    embeddingDim: Number(process.env.GEMINI_EMBEDDING_DIM || 768),
    llmModel: process.env.GEMINI_LLM_MODEL || "gemini-flash-latest",
  },
  geminiConfigured: Boolean(clean("GEMINI_API_KEY")),

  rag: {
    chunkSize: Number(process.env.CHUNK_SIZE || 1000),
    chunkOverlap: Number(process.env.CHUNK_OVERLAP || 150),
    topK: Number(process.env.RETRIEVAL_TOP_K || 5),
    vectorIndexName: process.env.VECTOR_INDEX_NAME || "chunks_vector_index",
  },

  maxUploadBytes: Number(process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024,

  redisUrl: optional("REDIS_URL"),

  mail: {
    from: process.env.MAIL_FROM || "Retrivo Vault <no-reply@retrivo.local>",
    smtpUrl: optional("SMTP_URL"),
  },

  stripe: {
    secretKey: optional("STRIPE_SECRET_KEY"),
    webhookSecret: optional("STRIPE_WEBHOOK_SECRET"),
    priceProMonthly: optional("STRIPE_PRICE_PRO_MONTHLY"),
    priceProAnnual: optional("STRIPE_PRICE_PRO_ANNUAL"),
    priceMaxMonthly: optional("STRIPE_PRICE_MAX_MONTHLY"),
    priceMaxAnnual: optional("STRIPE_PRICE_MAX_ANNUAL"),
  },

  // Emails granted admin access to /api/admin/* (legacy / additional admins).
  adminEmails: (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),

  // The root admin, provisioned at boot from these two vars (see
  // services/adminBootstrap.js). Never commit real values — each deployment
  // sets its own. `ADMIN_PASSWORD` is read once at startup and never logged.
  admin: {
    email: clean("ADMIN_EMAIL")?.trim().toLowerCase() || null,
    password: clean("ADMIN_PASSWORD") || null,
    name: process.env.ADMIN_NAME || "Administrator",
  },

  // Web Push (VAPID). Without both keys, push is disabled and broadcasts fall
  // back to in-app + email only (see services/pushService.js).
  push: {
    vapidPublic: optional("VAPID_PUBLIC_KEY"),
    vapidPrivate: optional("VAPID_PRIVATE_KEY"),
    subject: process.env.VAPID_SUBJECT || "mailto:admin@retrivo.local",
  },

  // A session counts as "online" if its last heartbeat was within this window.
  presenceWindowMs:
    Math.max(1, Number(process.env.PRESENCE_WINDOW_MIN || 2)) * 60 * 1000,

  // Auto-on when there's no real DB or no Gemini key (local demo). Also honours DEMO_MODE=true.
  get demoMode() {
    return (
      process.env.DEMO_MODE === "true" || this.autoMongo || !this.geminiConfigured
    );
  },
};

export const isProd = isProdEnv;
export const isTestEnv = isTest;
export const billingEnabled = Boolean(env.stripe.secretKey);
export const mailEnabled = Boolean(env.mail.smtpUrl);
export const pushEnabled = Boolean(
  env.push.vapidPublic && env.push.vapidPrivate
);
