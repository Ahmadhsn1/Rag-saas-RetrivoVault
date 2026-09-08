import { ActivityLog } from "../models/ActivityLog.js";

/** Fire-and-forget audit entry. Never throws into the request path. */
export function logActivity(userId, action, detail = "", req = null) {
  ActivityLog.create({
    userId,
    action,
    detail,
    ip: req?.ip ?? null,
    userAgent: req?.headers?.["user-agent"]?.slice(0, 300) ?? null,
  }).catch(() => {});
}

export async function listActivity(userId, { limit = 50, before } = {}) {
  const q = { userId };
  if (before) q.createdAt = { $lt: new Date(before) };
  return ActivityLog.find(q)
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 100))
    .lean();
}
