import { UserSession, describeDevice } from "../models/UserSession.js";
import { env } from "../config/env.js";

/**
 * Session lifecycle + presence. All writes here are best-effort: a failure must
 * never break auth, so callers fire-and-forget (or catch) these.
 */

function meta(req) {
  const ua = req?.headers?.["user-agent"]?.slice(0, 300) ?? null;
  return { ip: req?.ip ?? null, userAgent: ua, device: describeDevice(ua) };
}

/** New device signed in — one UserSession per refresh-token family. */
export async function openSession(userId, family, req) {
  if (!family) return null;
  const now = new Date();
  return UserSession.findOneAndUpdate(
    { family },
    {
      $set: { userId, lastSeenAt: now, endedAt: null, endReason: null, ...meta(req) },
      $setOnInsert: { startedAt: now },
    },
    { upsert: true, new: true }
  ).catch(() => null);
}

/** Client heartbeat / token refresh — bump last-seen on an open session. */
export async function touchSession({ family, userId }, req) {
  const now = new Date();
  if (family) {
    const patch = { lastSeenAt: now };
    const m = meta(req);
    if (m.ip) patch.ip = m.ip;
    const res = await UserSession.updateOne(
      { family, endedAt: null },
      { $set: patch }
    ).catch(() => null);
    if (res?.matchedCount) return;
  }
  // No family (older token) — bump this user's most recent open session instead.
  if (userId) {
    const latest = await UserSession.findOne({ userId, endedAt: null })
      .sort({ lastSeenAt: -1 })
      .catch(() => null);
    if (latest) {
      latest.lastSeenAt = now;
      await latest.save().catch(() => {});
    }
  }
}

/** Close one session (single-device logout / device revoke). */
export async function closeSession(family, reason = "logout") {
  if (!family) return;
  await UserSession.updateOne(
    { family, endedAt: null },
    { $set: { endedAt: new Date(), endReason: reason } }
  ).catch(() => {});
}

/** Close every open session for a user (logout-all / suspend / password reset). */
export async function closeAllSessions(userId, reason = "logout_all") {
  await UserSession.updateMany(
    { userId, endedAt: null },
    { $set: { endedAt: new Date(), endReason: reason } }
  ).catch(() => {});
}

/** Cutoff Date before which an open session is considered offline. */
export function presenceCutoff() {
  return new Date(Date.now() - env.presenceWindowMs);
}

/**
 * Sweep open sessions whose last heartbeat is well past the presence window and
 * mark them ended, so duration stats and "online" stay honest when a tab is
 * closed without a logout. Runs from the scheduler.
 */
export async function sweepStaleSessions() {
  const staleBefore = new Date(Date.now() - Math.max(env.presenceWindowMs * 10, 30 * 60 * 1000));
  const res = await UserSession.updateMany(
    { endedAt: null, lastSeenAt: { $lt: staleBefore } },
    [{ $set: { endedAt: "$lastSeenAt", endReason: "expired" } }]
  ).catch(() => ({ modifiedCount: 0 }));
  return res.modifiedCount || 0;
}
