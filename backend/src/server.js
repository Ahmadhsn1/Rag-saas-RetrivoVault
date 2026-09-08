import { createApp } from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { env, billingEnabled, mailEnabled } from "./config/env.js";
import { logger } from "./config/logger.js";
import { Document } from "./models/Document.js";
import "./services/ingestionService.js"; // registers the ingest job handler

async function requeueStuckDocuments() {
  // An in-process queue loses jobs on restart. Mark anything stuck in
  // "processing" as failed so the user can retry, rather than hanging forever.
  const stuck = await Document.updateMany(
    { status: "processing", updatedAt: { $lt: new Date(Date.now() - 5 * 60_000) } },
    { status: "failed", error: "Ingestion interrupted by a restart — re-upload to retry." }
  );
  if (stuck.modifiedCount) {
    logger.warn(`marked ${stuck.modifiedCount} stuck document(s) as failed`);
  }
}

async function main() {
  await connectDB();
  await requeueStuckDocuments().catch((e) =>
    logger.error({ err: e }, "stuck-doc sweep failed")
  );

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(
      { port: env.port, env: env.nodeEnv, billing: billingEnabled, mail: mailEnabled },
      "Retrivo Vault API listening"
    );
  });

  const shutdown = async (signal) => {
    logger.info({ signal }, "shutting down");
    server.close(async () => {
      await disconnectDB();
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
