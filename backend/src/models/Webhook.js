import mongoose from "mongoose";
import crypto from "node:crypto";

const WEBHOOK_EVENTS = [
  "document.ready",
  "document.failed",
  "chat.answered",
];

const webhookSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    url: { type: String, required: true },
    events: {
      type: [String],
      enum: WEBHOOK_EVENTS,
      default: WEBHOOK_EVENTS,
    },
    secret: { type: String, required: true }, // HMAC signing key, shown once
    active: { type: Boolean, default: true },
    lastStatus: { type: Number, default: null },
    lastDeliveryAt: { type: Date, default: null },
    failureCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

webhookSchema.methods.toJSON = function () {
  const { secret, __v, ...rest } = this.toObject();
  void secret;
  return rest;
};

export const newWebhookSecret = () =>
  `whsec_${crypto.randomBytes(24).toString("base64url")}`;

export { WEBHOOK_EVENTS };
export const Webhook = mongoose.model("Webhook", webhookSchema);
