import { createApp } from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { env, billingEnabled, mailEnabled } from "./config/env.js";
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
    console.warn(`[server] marked ${stuck.modifiedCount} stuck document(s) as failed`);
  }
}

async function main() {
  await connectDB();
  await requeueStuckDocuments().catch((e) =>
    console.error("[server] stuck-doc sweep failed:", e.message)
  );

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(
      `[server] Retrivo Vault API on :${env.port} (${env.nodeEnv}) · billing=${billingEnabled} mail=${mailEnabled}`
    );
  });

  const shutdown = async (signal) => {
    console.log(`\n[server] ${signal} received, shutting down`);
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
  console.error("[server] fatal startup error:", err);
  process.exit(1);
});
