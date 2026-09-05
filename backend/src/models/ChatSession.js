import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    citedChunkIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Chunk" },
    ],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
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
  },
  { timestamps: true }
);

export const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
