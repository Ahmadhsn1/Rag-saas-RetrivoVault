import mongoose from "mongoose";
import { Chunk } from "../models/Chunk.js";
import { Document } from "../models/Document.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { embedQuery } from "./embeddingService.js";

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

// Every read below is filtered by `userId` (and the vector index carries it as
// a filter field): that filter is what enforces per-user isolation.
const scope = (userId, collectionId) => ({
  userId: toObjectId(userId),
  ...(collectionId ? { collectionId: toObjectId(collectionId) } : {}),
});

const FIELDS = { _id: 1, text: 1, order: 1, page: 1, documentId: 1, collectionId: 1 };

// Meaning: Atlas $vectorSearch over the user's chunk embeddings.
async function semanticSearch({ userId, question, collectionId, limit, embeddingModel }) {
  const queryVector = await embedQuery(question, embeddingModel);
  return Chunk.aggregate([
    {
      $vectorSearch: {
        index: env.rag.vectorIndexName,
        path: "embedding",
        queryVector,
        numCandidates: Math.max(limit * 20, 100),
        limit,
        filter: scope(userId, collectionId),
      },
    },
    { $project: { ...FIELDS, score: { $meta: "vectorSearchScore" } } },
  ]);
}

// Exact words: names, clause numbers, amounts — what embeddings blur.
function keywordSearch({ userId, question, collectionId, limit }) {
  return Chunk.find(
    { ...scope(userId, collectionId), $text: { $search: question } },
    { ...FIELDS, textScore: { $meta: "textScore" } }
  )
    .sort({ textScore: { $meta: "textScore" } })
    .limit(limit)
    .lean();
}

/**
 * Hybrid retrieval: semantic + keyword results merged with reciprocal rank
 * fusion. If one side is unavailable the other still answers; it only throws
 * when both fail.
 */
export async function retrieveChunks({
  userId,
  question,
  collectionId = null,
  topK = env.rag.topK,
  embeddingModel = undefined,
}) {
  const args = { userId, question, collectionId, limit: topK * 2, embeddingModel };
  const [semantic, keyword] = await Promise.allSettled([
    semanticSearch(args),
    keywordSearch(args),
  ]);
  if (semantic.status === "rejected" && keyword.status === "rejected") {
    throw semantic.reason;
  }
  if (semantic.status === "rejected") {
    logger.warn({ err: semantic.reason?.message }, "semantic search unavailable — keyword only");
  }

  const RRF_K = 60;
  const merged = new Map();
  const add = (list, kind) =>
    list.forEach((chunk, rank) => {
      const id = String(chunk._id);
      const entry = merged.get(id) || { ...chunk, score: 0, rank: 0, matchedBy: [] };
      entry.rank += 1 / (RRF_K + rank + 1);
      entry.matchedBy.push(kind);
      // `score` shown to users stays the cosine similarity when there is one.
      if (kind === "semantic") entry.score = chunk.score;
      merged.set(id, entry);
    });
  if (semantic.status === "fulfilled") add(semantic.value, "semantic");
  if (keyword.status === "fulfilled") add(keyword.value, "keyword");

  const top = [...merged.values()].sort((a, b) => b.rank - a.rank).slice(0, topK);

  const docs = await Document.find(
    { _id: { $in: top.map((c) => c.documentId) }, userId: toObjectId(userId) },
    { filename: 1 }
  ).lean();
  const names = new Map(docs.map((d) => [String(d._id), d.filename]));

  return top.map(({ rank, textScore, ...chunk }) => {
    void rank;
    void textScore;
    return { ...chunk, filename: names.get(String(chunk.documentId)) };
  });
}
