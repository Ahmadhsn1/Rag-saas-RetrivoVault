import mongoose from "mongoose";
import crypto from "node:crypto";

/**
 * One row per issued refresh token. Enables rotation, revocation, and
 * reuse detection: if a token that has already been rotated is presented
 * again, the whole `family` is revoked (likely theft).
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    family: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    rotatedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    userAgent: { type: String, default: null },
    ip: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// purge rows a week past expiry
refreshTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60 }
);

export const hashRefreshToken = (raw) =>
  crypto.createHash("sha256").update(raw).digest("hex");

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
