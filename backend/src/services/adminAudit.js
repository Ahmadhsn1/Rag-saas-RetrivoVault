import { AdminAudit } from "../models/AdminAudit.js";

/**
 * Fire-and-forget operator audit entry. Never throws into the request path.
 * `target` may be a user doc, a plain { _id, email }, or null.
 */
export function audit(req, action, target = null, meta = {}) {
  const admin = req.adminUser || {};
  AdminAudit.create({
    adminId: admin._id,
    adminEmail: admin.email ?? null,
    action,
    targetUserId: target?._id ?? null,
    targetEmail: target?.email ?? null,
    meta,
    ip: req?.ip ?? null,
    userAgent: req?.headers?.["user-agent"]?.slice(0, 300) ?? null,
  }).catch(() => {});
}

export async function listAudit({ limit = 50, before, action } = {}) {
  const q = {};
  if (before) q.createdAt = { $lt: new Date(before) };
  if (action) q.action = action;
  return AdminAudit.find(q)
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(Number(limit) || 50, 1), 200))
    .lean();
}
