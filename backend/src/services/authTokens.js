import crypto from "node:crypto";
import { Token, hashToken } from "../models/Token.js";

const TTL = {
  email_verify: 24 * 60 * 60 * 1000,
  password_reset: 60 * 60 * 1000,
};

/** Creates a one-time token, returns the raw value (only shown here). */
export async function issueToken(userId, type) {
  // Invalidate any outstanding tokens of the same type for this user.
  await Token.deleteMany({ userId, type, usedAt: null });

  const raw = crypto.randomBytes(32).toString("base64url");
  await Token.create({
    userId,
    type,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + TTL[type]),
  });
  return raw;
}

/** Consumes a token; returns the userId or null. */
export async function consumeToken(raw, type) {
  if (!raw) return null;
  const doc = await Token.findOne({
    tokenHash: hashToken(raw),
    type,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!doc) return null;
  doc.usedAt = new Date();
  await doc.save();
  return String(doc.userId);
}
