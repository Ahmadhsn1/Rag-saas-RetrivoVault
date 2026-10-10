import crypto from "node:crypto";
import ms from "../utils/ms.js";
import { env } from "../config/env.js";
import { RefreshToken, hashRefreshToken } from "../models/RefreshToken.js";
import {
  openSession,
  touchSession,
  closeSession,
  closeAllSessions,
} from "./presence.js";

// A replayed just-rotated token within this window is treated as a client retry
// (StrictMode double-mount, network retry), not theft.
const REPLAY_GRACE_MS = 15_000;

function newRawToken() {
  return crypto.randomBytes(40).toString("base64url");
}

function reqMeta(req) {
  return {
    userAgent: req?.headers?.["user-agent"]?.slice(0, 300) ?? null,
    ip: req?.ip ?? null,
  };
}

/** First token of a new session (login / signup). */
export async function startSession(userId, req) {
  const raw = newRawToken();
  const family = crypto.randomUUID();
  await RefreshToken.create({
    userId,
    family,
    tokenHash: hashRefreshToken(raw),
    expiresAt: new Date(Date.now() + ms(env.jwt.refreshTtl)),
    ...reqMeta(req),
  });
  await openSession(userId, family, req);
  return { raw, family };
}

/**
 * Rotate a presented refresh token. Returns { userId, raw, family } on success.
 * Throws { code } on failure: "invalid" | "expired" | "reuse".
 */
export async function rotate(rawPresented, req) {
  if (!rawPresented) throw Object.assign(new Error("no token"), { code: "invalid" });

  const current = await RefreshToken.findOne({
    tokenHash: hashRefreshToken(rawPresented),
  });
  if (!current) throw Object.assign(new Error("unknown token"), { code: "invalid" });

  if (current.revokedAt) {
    // token from a family we already killed
    throw Object.assign(new Error("revoked"), { code: "reuse" });
  }

  if (current.rotatedAt) {
    const age = Date.now() - current.rotatedAt.getTime();
    if (age > REPLAY_GRACE_MS) {
      // genuine reuse of an old token -> revoke the whole family
      await RefreshToken.updateMany(
        { family: current.family, revokedAt: null },
        { revokedAt: new Date() }
      );
      throw Object.assign(new Error("token reuse detected"), { code: "reuse" });
    }
    // within grace: issue a sibling in the same family, don't revoke
  } else {
    if (current.expiresAt.getTime() < Date.now()) {
      throw Object.assign(new Error("expired"), { code: "expired" });
    }
    current.rotatedAt = new Date();
    await current.save();
  }

  const raw = newRawToken();
  await RefreshToken.create({
    userId: current.userId,
    family: current.family,
    tokenHash: hashRefreshToken(raw),
    expiresAt: new Date(Date.now() + ms(env.jwt.refreshTtl)),
    ...reqMeta(req),
  });

  await touchSession(
    { family: current.family, userId: String(current.userId) },
    req
  );

  return { userId: String(current.userId), raw, family: current.family };
}

/** Revoke just the family of the presented token (single-device logout). */
export async function revokeByToken(rawPresented) {
  if (!rawPresented) return;
  const doc = await RefreshToken.findOne({
    tokenHash: hashRefreshToken(rawPresented),
  });
  if (!doc) return;
  await RefreshToken.updateMany(
    { family: doc.family, revokedAt: null },
    { revokedAt: new Date() }
  );
  await closeSession(doc.family, "logout");
}

/** Revoke every active session for a user (sign out everywhere / delete account). */
export async function revokeAllForUser(userId, reason = "logout_all") {
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { revokedAt: new Date() }
  );
  await closeAllSessions(userId, reason);
}

/** Revoke a single device by its family id (admin force-logout / user device list). */
export async function revokeFamily(userId, family, reason = "revoked") {
  if (!family) return;
  await RefreshToken.updateMany(
    { userId, family, revokedAt: null },
    { revokedAt: new Date() }
  );
  await closeSession(family, reason);
}
