/**
 * Creates the Atlas Vector Search index on the `chunks` collection.
 * Requires MongoDB Atlas (M0+) and driver support for search index management.
 *
 *   node src/scripts/createVectorIndex.js
 */
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { vectorIndex } from "../config/vectorIndex.js";

async function run() {
  await mongoose.connect(env.mongoUri);
  const collection = mongoose.connection.db.collection("chunks");

  const existing = await collection.listSearchIndexes().toArray();
  if (existing.some((i) => i.name === vectorIndex.name)) {
    console.log(`Index "${vectorIndex.name}" already exists.`);
  } else {
    await collection.createSearchIndex(vectorIndex);
    console.log(`Created index "${vectorIndex.name}". It may take a minute to build.`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
