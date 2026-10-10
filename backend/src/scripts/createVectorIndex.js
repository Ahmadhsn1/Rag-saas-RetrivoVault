/**
 * Creates the Atlas Vector Search index on the `chunks` collection. The server
 * also does this on boot; run it by hand to set a deployment up ahead of time.
 *
 *   node src/scripts/createVectorIndex.js
 */
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { ensureVectorIndex, vectorIndex } from "../services/vectorIndex.js";

async function run() {
  await mongoose.connect(env.mongoUri);
  const created = await ensureVectorIndex();
  console.log(
    created
      ? `Created index "${vectorIndex.name}". It may take a minute to build.`
      : `Index "${vectorIndex.name}" already exists.`
  );
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
