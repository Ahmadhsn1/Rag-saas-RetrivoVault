import { createApp } from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { env, billingEnabled, mailEnabled } from "./config/env.js";
import { logger } from "./config/logger.js";
import { Document } from "./models/Document.js";
import { startScheduler, stopScheduler } from "./services/scheduler.js";
import { bootstrapAdmin } from "./services/adminBootstrap.js";
import "./services/ingestionService.js"; // registers the ingest job handler

let memoryMongo = null;

/**
 * When there's no MONGO_URI (local dev), spin up an ephemeral in-memory MongoDB
 * so the API still boots. Vector search won't work here (Atlas-only) — the app
 * degrades to keyword-ish retrieval failures gracefully — but every other
 * endpoint is fully usable.
 */
async function resolveMongoUri() {
  if (env.mongoUri) return env.mongoUri;
  if (!env.autoMongo) throw new Error("MONGO_URI is required");

  logger.warn(
    "no MONGO_URI set — starting an in-memory MongoDB (dev only; add backend/.env with a MongoDB Atlas URI for real vector search)"
  );
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  memoryMongo = await MongoMemoryServer.create();
  return memoryMongo.getUri("retrivo_vault");
}

async function requeueStuckDocuments() {
  const stuck = await Document.updateMany(
    { status: "processing", updatedAt: { $lt: new Date(Date.now() - 5 * 60_000) } },
    { status: "failed", error: "Ingestion interrupted by a restart — re-upload to retry." }
  );
  if (stuck.modifiedCount) {
    logger.warn(`marked ${stuck.modifiedCount} stuck document(s) as failed`);
  }
}

async function main() {
  env.mongoUri = await resolveMongoUri();
  await connectDB();
  await requeueStuckDocuments().catch((e) =>
    logger.error({ err: e }, "stuck-doc sweep failed")
  );
  await bootstrapAdmin().catch((e) => {
    logger.fatal({ err: e }, "admin bootstrap failed");
    process.exit(1);
  });

  if (!env.geminiConfigured) {
    logger.warn(
      "no GEMINI_API_KEY set — ingestion and chat will fail at the model call until you add one"
    );
  }

  startScheduler();

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(
      {
        port: env.port,
        env: env.nodeEnv,
        db: memoryMongo ? "in-memory" : "external",
        gemini: env.geminiConfigured,
        billing: billingEnabled,
        mail: mailEnabled,
        demoMode: env.demoMode,
      },
      "Retrivo Vault API listening"
    );
  });

  const shutdown = async (signal) => {
    logger.info({ signal }, "shutting down");
    stopScheduler();
    server.close(async () => {
      await disconnectDB();
      await memoryMongo?.stop();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.fatal({ err }, "fatal startup error");
  process.exit(1);
});
