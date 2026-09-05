import mongoose from "mongoose";

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

export const Document = mongoose.model("Document", documentSchema);
