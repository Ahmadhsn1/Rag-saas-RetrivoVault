import dotenv from "dotenv";

dotenv.config();

const isTest = process.env.NODE_ENV === "test";

function required(key) {
  const value = process.env[key];
  if (!value) {
    if (isTest) return `test-${key.toLowerCase()}`;
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key, fallback = undefined) {
  return process.env[key] || fallback;
}

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  appUrl: process.env.APP_URL || "http://localhost:5173",

  mongoUri: required("MONGO_URI"),

  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    accessTtl: process.env.JWT_ACCESS_TTL || "15m",
    refreshTtl: process.env.JWT_REFRESH_TTL || "7d",
  },

  gemini: {
    apiKey: required("GEMINI_API_KEY"),
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004",
    llmModel: process.env.GEMINI_LLM_MODEL || "gemini-2.5-flash",
  },

  rag: {
    chunkSize: Number(process.env.CHUNK_SIZE || 1000),
    chunkOverlap: Number(process.env.CHUNK_OVERLAP || 150),
    topK: Number(process.env.RETRIEVAL_TOP_K || 5),
    vectorIndexName: process.env.VECTOR_INDEX_NAME || "chunks_vector_index",
  },

  maxUploadBytes: Number(process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024,

  // Optional Redis-backed job queue. Without it, ingestion runs in-process.
  redisUrl: optional("REDIS_URL"),

  mail: {
    from: process.env.MAIL_FROM || "Retrivo Vault <no-reply@retrivo.local>",
    smtpUrl: optional("SMTP_URL"), // e.g. smtp://user:pass@host:587
  },

  stripe: {
    secretKey: optional("STRIPE_SECRET_KEY"),
    webhookSecret: optional("STRIPE_WEBHOOK_SECRET"),
    priceProMonthly: optional("STRIPE_PRICE_PRO_MONTHLY"),
    priceProAnnual: optional("STRIPE_PRICE_PRO_ANNUAL"),
    priceMaxMonthly: optional("STRIPE_PRICE_MAX_MONTHLY"),
    priceMaxAnnual: optional("STRIPE_PRICE_MAX_ANNUAL"),
  },

  // When true, email links are auto-verified and billing is stubbed (dev/demo).
  demoMode: process.env.DEMO_MODE === "true",
};

export const isProd = env.nodeEnv === "production";
export const isTestEnv = isTest;
export const billingEnabled = Boolean(env.stripe.secretKey);
export const mailEnabled = Boolean(env.mail.smtpUrl);
