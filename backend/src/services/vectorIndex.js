import { env } from "../config/env.js";
import { Chunk } from "../models/Chunk.js";

// The Atlas Vector Search index over chunk embeddings. `userId` and
// `collectionId` are filter fields so every search is scoped inside the index.
export const vectorIndex = {
  name: env.rag.vectorIndexName,
  type: "vectorSearch",
  definition: {
    fields: [
      {
        type: "vector",
        path: "embedding",
        numDimensions: env.gemini.embeddingDim,
        similarity: "cosine",
      },
      { type: "filter", path: "userId" },
      { type: "filter", path: "collectionId" },
    ],
  },
};

/**
 * Creates the vector index if it is missing. Returns true when it was created.
 * Throws on deployments without Atlas Search (plain mongod, in-memory dev DB).
 */
export async function ensureVectorIndex() {
  // A search index can't be created on a collection that doesn't exist yet.
  await Chunk.createCollection();
  await Chunk.init(); // the keyword (text) index
  const existing = await Chunk.collection.listSearchIndexes(vectorIndex.name).toArray();
  if (existing.length) return false;
  await Chunk.collection.createSearchIndex(vectorIndex);
  return true;
}
