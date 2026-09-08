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
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004",
    llmModel: process.env.GEMINI_LLM_MODEL || "gemini-2.5-flash",
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
