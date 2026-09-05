import { createApp } from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { env } from "./config/env.js";

async function main() {
  await connectDB();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[server] Retrivo Vault API listening on :${env.port} (${env.nodeEnv})`);
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
