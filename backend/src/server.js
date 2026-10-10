import { createApp } from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { env, billingEnabled, mailEnabled } from "./config/env.js";
import { logger } from "./config/logger.js";
import { startScheduler, stopScheduler } from "./services/scheduler.js";
import { resumeInterruptedIngestion } from "./services/ingestionService.js";

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

async function main() {
  env.mongoUri = await resolveMongoUri();
  await connectDB();
  await resumeInterruptedIngestion()
    .then((r) => {
      if (r.resumed || r.failed) logger.warn(r, "resumed interrupted ingestion");
    })
    .catch((e) => logger.error({ err: e }, "ingestion resume failed"));

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
