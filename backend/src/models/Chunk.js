import mongoose from "mongoose";

const chunkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      default: null,
    },
    order: { type: Number, required: true },
    // 1-based page in the source PDF; null for formats without pages.
    page: { type: Number, default: null },
    text: { type: String, required: true },
    // 768-dim vector from Gemini gemini-embedding-2.
    // The Atlas Vector Search index on this path is created out-of-band
    // (see scripts/createVectorIndex.js / README section 5).
    embedding: { type: [Number], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Keyword half of hybrid retrieval (services/retrievalService.js).
chunkSchema.index({ userId: 1, text: "text" });

export const Chunk = mongoose.model("Chunk", chunkSchema);
