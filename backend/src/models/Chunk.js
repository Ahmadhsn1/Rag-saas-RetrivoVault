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
    text: { type: String, required: true },
    // 768-dim vector from Gemini text-embedding-004.
    // The Atlas Vector Search index on this path is created out-of-band
    // (see scripts/createVectorIndex.js / README section 5).
    embedding: { type: [Number], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Chunk = mongoose.model("Chunk", chunkSchema);
