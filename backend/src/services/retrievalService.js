import mongoose from "mongoose";
import { Chunk } from "../models/Chunk.js";
import { env } from "../config/env.js";
import { embedQuery } from "./embeddingService.js";

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

// Runs Atlas $vectorSearch over ONLY the requesting user's chunks.
// The `userId` filter in the pipeline + the vector index's filter field
// is what enforces per-user isolation.
export async function retrieveChunks({
  userId,
  question,
  collectionId = null,
  topK = env.rag.topK,
  embeddingModel = undefined,
}) {
  const queryVector = await embedQuery(question, embeddingModel);

  const filter = { userId: toObjectId(userId) };
  if (collectionId) filter.collectionId = toObjectId(collectionId);

  const results = await Chunk.aggregate([
    {
      $vectorSearch: {
        index: env.rag.vectorIndexName,
        path: "embedding",
        queryVector,
        numCandidates: Math.max(topK * 20, 100),
        limit: topK,
        filter,
      },
    },
    {
      $project: {
        _id: 1,
        text: 1,
        order: 1,
        documentId: 1,
        collectionId: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  return results;
}
