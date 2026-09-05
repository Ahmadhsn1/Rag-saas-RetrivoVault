import dotenv from "dotenv";

dotenv.config();

function required(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",

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
};

export const isProd = env.nodeEnv === "production";
