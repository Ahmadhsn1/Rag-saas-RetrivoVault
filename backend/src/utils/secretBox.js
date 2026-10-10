import crypto from "node:crypto";
import { env } from "../config/env.js";

// AES-256-GCM for secrets we must be able to read back (e.g. a user's own
// Gemini key). Format: v1:<iv>:<tag>:<ciphertext>, all base64url.
const key = crypto.createHash("sha256").update(env.encryptionKey).digest();

export function seal(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    data.toString("base64url"),
  ].join(":");
}

/** Returns the plaintext, or null if the value is missing or can't be opened. */
export function open(sealed) {
  if (!sealed) return null;
  const [v, iv, tag, data] = String(sealed).split(":");
  // Values written before encryption-at-rest was added are plain keys.
  if (v !== "v1" || !data) return sealed;
  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(iv, "base64url")
    );
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(data, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}
