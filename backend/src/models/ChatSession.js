import mongoose from "mongoose";
import crypto from "node:crypto";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    citedChunkIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chunk" }],
    // denormalized so history renders sources without re-querying
    sources: { type: mongoose.Schema.Types.Mixed, default: undefined },
    feedback: { type: String, enum: ["up", "down"], default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, default: "New chat" },
    messages: { type: [messageSchema], default: [] },

    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      default: null,
    },
    pinned: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },

    // read-only public share
    shareId: { type: String, default: null, index: true, sparse: true },
    sharedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

chatSessionSchema.methods.enableShare = function () {
  if (!this.shareId) {
    this.shareId = crypto.randomBytes(9).toString("base64url");
    this.sharedAt = new Date();
  }
  return this.shareId;
};

export const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
