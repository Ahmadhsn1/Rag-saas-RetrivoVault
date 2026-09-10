import mongoose from "mongoose";

/**
 * A browser Web Push subscription (the object returned by
 * `PushManager.subscribe()`). One per device that opted in. Keyed by the
 * endpoint URL so re-subscribing is idempotent. Pruned when a push returns
 * 404/410 (subscription gone).
 */
const pushSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: { type: String, default: null },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const PushSubscription = mongoose.model(
  "PushSubscription",
  pushSubscriptionSchema
);
