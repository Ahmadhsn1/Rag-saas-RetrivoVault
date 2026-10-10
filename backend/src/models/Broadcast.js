import mongoose from "mongoose";

/**
 * One admin-sent announcement. The actual per-user delivery is via the existing
 * `Notification` collection (type "announcement"), optional email, and optional
 * Web Push. This row is the dashboard history + delivery tally.
 */
const broadcastSchema = new mongoose.Schema(
  {
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sentByEmail: { type: String, default: null },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    link: { type: String, default: null },

    // "all" | "plan:free" | "plan:pro" | "plan:max" | "comped" | "online" | "active7d" | "user:<id>"
    audience: { type: String, required: true },
    audienceLabel: { type: String, default: null },

    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
    },

    // filled in as the fan-out runs
    recipientCount: { type: Number, default: 0 },
    delivered: {
      inApp: { type: Number, default: 0 },
      email: { type: Number, default: 0 },
      push: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["sending", "sent", "failed"],
      default: "sending",
    },
    error: { type: String, default: null },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

broadcastSchema.index({ createdAt: -1 });

export const Broadcast = mongoose.model("Broadcast", broadcastSchema);
