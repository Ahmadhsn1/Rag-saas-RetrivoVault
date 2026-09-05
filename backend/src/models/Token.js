import mongoose from "mongoose";
import crypto from "node:crypto";

const tokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["email_verify", "password_reset"],
      required: true,
    },
    // Only the SHA-256 hash of the token is stored.
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Auto-purge expired tokens.
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const hashToken = (raw) =>
  crypto.createHash("sha256").update(raw).digest("hex");

export const Token = mongoose.model("Token", tokenSchema);
