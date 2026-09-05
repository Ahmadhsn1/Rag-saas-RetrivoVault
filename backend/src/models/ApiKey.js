import mongoose from "mongoose";
import crypto from "node:crypto";

const apiKeySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    // Store only the hash; show the plaintext once at creation.
    keyHash: { type: String, required: true, unique: true, index: true },
    prefix: { type: String, required: true }, // first 8 chars, for display
    lastUsedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

apiKeySchema.methods.toJSON = function () {
  const { keyHash, __v, ...rest } = this.toObject();
  void keyHash;
  return rest;
};

export const generateApiKey = () => {
  const raw = `rv_${crypto.randomBytes(24).toString("base64url")}`;
  return { raw, prefix: raw.slice(0, 8), hash: hashApiKey(raw) };
};

export const hashApiKey = (raw) =>
  crypto.createHash("sha256").update(raw).digest("hex");

export const ApiKey = mongoose.model("ApiKey", apiKeySchema);
