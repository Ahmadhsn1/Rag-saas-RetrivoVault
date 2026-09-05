import mongoose from "mongoose";

const usageEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ["query", "ingest"],
      required: true,
    },
    // arbitrary small numeric payload (tokens, chunks, bytes…)
    amount: { type: Number, default: 1 },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

usageEventSchema.index({ userId: 1, kind: 1, createdAt: -1 });
// keep 400 days of history
usageEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 400 });

export const UsageEvent = mongoose.model("UsageEvent", usageEventSchema);
