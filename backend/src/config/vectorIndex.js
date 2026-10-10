import { env } from "./env.js";

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
