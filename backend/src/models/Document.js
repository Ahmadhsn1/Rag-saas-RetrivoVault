import mongoose from "mongoose";
import crypto from "node:crypto";

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      default: null,
    },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    // sha-256 of the extracted text — used to skip re-embedding duplicates
    contentHash: { type: String, default: null, index: true },
    // set when the document was ingested from a URL
    sourceUrl: { type: String, default: null },
    // one-paragraph AI summary produced during ingestion
    summary: { type: String, default: null },
    // AI-suggested starter questions
    suggestedQuestions: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["processing", "ready", "failed"],
      default: "processing",
    },
    chunkCount: { type: Number, default: 0 },
    error: { type: String, default: null },
  },
  { timestamps: { createdAt: "uploadedAt", updatedAt: true } }
);

export const hashContent = (text) =>
  crypto.createHash("sha256").update(text).digest("hex");

export const Document = mongoose.model("Document", documentSchema);
