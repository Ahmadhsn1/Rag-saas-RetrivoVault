/**
 * Boots the API against an ephemeral in-memory MongoDB — no Atlas needed.
 * For local smoke-testing of everything EXCEPT vector search (which needs Atlas)
 * and live Gemini/Stripe calls.
 *
 *   node scripts/dev-standalone.mjs
 */
import { MongoMemoryServer } from "mongodb-memory-server";

const mongod = await MongoMemoryServer.create();
process.env.MONGO_URI = mongod.getUri("retrivo_dev");
process.env.JWT_ACCESS_SECRET ||= "dev-access-secret-000000000000000000";
process.env.JWT_REFRESH_SECRET ||= "dev-refresh-secret-1111111111111111";
process.env.GEMINI_API_KEY ||= "dev-key";
process.env.NODE_ENV ||= "development";
process.env.DEMO_MODE ||= "true";
process.env.PORT ||= "5000";

console.log(`[dev-standalone] in-memory Mongo at ${process.env.MONGO_URI}`);

await import("../src/server.js");

const stop = async () => {
  await mongod.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
