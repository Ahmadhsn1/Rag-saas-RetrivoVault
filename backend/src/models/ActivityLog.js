import mongoose from "mongoose";

/** Append-only per-user audit trail shown in Settings → Activity. */
const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: { type: String, required: true }, // e.g. "auth.login", "document.upload"
    detail: { type: String, default: "" },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 180 }
);

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
