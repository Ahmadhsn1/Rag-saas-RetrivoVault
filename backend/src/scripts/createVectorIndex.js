/**
 * Creates the Atlas Vector Search index on the `chunks` collection.
 * Requires MongoDB Atlas (M0+) and driver support for search index management.
 *
 *   node src/scripts/createVectorIndex.js
 */
import mongoose from "mongoose";
import { env } from "../config/env.js";

async function run() {
  await mongoose.connect(env.mongoUri);
  const collection = mongoose.connection.db.collection("chunks");

  const definition = {
    fields: [
      {
        type: "vector",
        path: "embedding",
        numDimensions: 768,
        similarity: "cosine",
      },
      { type: "filter", path: "userId" },
      { type: "filter", path: "collectionId" },
    ],
  };

  const existing = await collection.listSearchIndexes().toArray();
  if (existing.some((i) => i.name === env.rag.vectorIndexName)) {
    console.log(`Index "${env.rag.vectorIndexName}" already exists.`);
  } else {
    await collection.createSearchIndex({
      name: env.rag.vectorIndexName,
      type: "vectorSearch",
      definition,
    });
    console.log(`Created index "${env.rag.vectorIndexName}". It may take a minute to build.`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
