import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "ingest_complete",
        "ingest_failed",
        "quota_warning",
        "trial_ending",
        "plan_changed",
        "welcome",
        "system",
        "announcement",
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    // where clicking it should take the user
    link: { type: String, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 }
);

export const Notification = mongoose.model("Notification", notificationSchema);
