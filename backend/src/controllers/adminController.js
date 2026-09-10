import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Document } from "../models/Document.js";
import { ChatSession } from "../models/ChatSession.js";
import { UsageEvent } from "../models/UsageEvent.js";
import { UserSession } from "../models/UserSession.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { PLANS } from "../config/plans.js";
import { env, billingEnabled, mailEnabled, pushEnabled } from "../config/env.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import { str } from "../middleware/sanitize.js";
import { logActivity } from "../services/activityLog.js";
import { notify } from "../services/notifications.js";
import { audit, listAudit } from "../services/adminAudit.js";
import { revokeAllForUser } from "../services/refreshTokens.js";
import { presenceCutoff } from "../services/presence.js";
import { queueStats } from "../services/jobQueue.js";
import { issueToken } from "../services/authTokens.js";
import { sendMail, resetPasswordTemplate } from "../services/mailer.js";
import {
  sendBroadcast,
  listBroadcasts,
  countAudience,
  AUDIENCES,
  pushSubscriberCount,
} from "../services/broadcast.js";

const PRICE = { free: 0, pro: 12, max: 29 }; // rough monthly, for an MRR estimate
const DAY = 24 * 60 * 60 * 1000;
const asId = (v) => (typeof v === "string" && /^[a-f\d]{24}$/i.test(v) ? v : null);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Load the :id target user and enforce the guard rails:
 *   - the root admin can't be suspended / demoted / deleted by anyone
 *   - an admin can't run destructive actions on their own account here
 */
async function loadTarget(req, { protectRoot = true, protectSelf = true } = {}) {
  const id = asId(req.params.id);
  if (!id) throw ApiError.notFound("User not found");
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound("User not found");

  if (protectSelf && String(user._id) === String(req.adminUser._id)) {
    throw ApiError.badRequest("You can't do that to your own admin account here");
  }
  if (protectRoot && user.isRootAdmin) {
    throw ApiError.forbidden("The root administrator account is protected");
  }
  return user;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const adminStats = asyncHandler(async (_req, res) => {
  const since30 = new Date(Date.now() - 30 * DAY);
  const cutoff = presenceCutoff();

  const [
    byPlan,
    users,
    documents,
    chats,
    queries30,
    newUsers30,
    onlineIds,
    activeTodayIds,
    active7dIds,
    comped,
    suspended,
    admins,
    pushSubs,
  ] = await Promise.all([
    User.aggregate([{ $group: { _id: "$plan", count: { $sum: 1 } } }]),
    User.countDocuments(),
    Document.countDocuments(),
    ChatSession.countDocuments(),
    UsageEvent.countDocuments({ kind: "query", createdAt: { $gte: since30 } }),
    User.countDocuments({ createdAt: { $gte: since30 } }),
    UserSession.distinct("userId", { endedAt: null, lastSeenAt: { $gte: cutoff } }),
    UserSession.distinct("userId", { lastSeenAt: { $gte: new Date(Date.now() - DAY) } }),
    UserSession.distinct("userId", { lastSeenAt: { $gte: new Date(Date.now() - 7 * DAY) } }),
    User.countDocuments({
      "comp.plan": { $ne: null },
      $or: [{ "comp.expiresAt": null }, { "comp.expiresAt": { $gt: new Date() } }],
    }),
    User.countDocuments({ suspendedAt: { $ne: null } }),
    User.countDocuments({ role: "admin" }),
    pushSubscriberCount(),
  ]);

  const planCounts = Object.fromEntries(byPlan.map((p) => [p._id, p.count]));
  const mrr = Object.entries(planCounts).reduce(
    (sum, [plan, n]) => sum + (PRICE[plan] || 0) * n,
    0
  );

  res.json({
    users,
    documents,
    chats,
    queriesLast30d: queries30,
    newUsersLast30d: newUsers30,
    planCounts,
    estimatedMrr: mrr,
    plans: Object.keys(PLANS),
    onlineNow: onlineIds.length,
    activeToday: activeTodayIds.length,
    active7d: active7dIds.length,
    compedUsers: comped,
    suspendedUsers: suspended,
    admins,
    pushSubscribers: pushSubs,
    health: {
      db: mongoose.connection.readyState === 1 ? "up" : "down",
      queue: queueStats(),
      features: {
        billing: billingEnabled,
        mail: mailEnabled,
        push: pushEnabled,
        gemini: env.geminiConfigured,
      },
    },
  });
});

/** Daily signups / queries / ingests for the last N days (sparkline data). */
export const adminTimeseries = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 7), 90);
  const start = new Date(Date.now() - days * DAY);
  start.setUTCHours(0, 0, 0, 0);

  const dayKey = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
  const [signups, events] = await Promise.all([
    User.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: dayKey, count: { $sum: 1 } } },
    ]),
    UsageEvent.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: { day: dayKey, kind: "$kind" }, count: { $sum: 1 } } },
    ]),
  ]);

  const signupBy = Object.fromEntries(signups.map((r) => [r._id, r.count]));
  const queryBy = {};
  const ingestBy = {};
  for (const r of events) {
    if (r._id.kind === "query") queryBy[r._id.day] = r.count;
    else if (r._id.kind === "ingest") ingestBy[r._id.day] = r.count;
  }

  const series = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start.getTime() + i * DAY);
    const key = d.toISOString().slice(0, 10);
    series.push({
      date: key,
      signups: signupBy[key] || 0,
      queries: queryBy[key] || 0,
      ingests: ingestBy[key] || 0,
    });
  }
  res.json({ days, series });
});

// ---------------------------------------------------------------------------
// Presence & sessions
// ---------------------------------------------------------------------------

export const adminPresence = asyncHandler(async (_req, res) => {
  const cutoff = presenceCutoff();
  const open = await UserSession.find({ endedAt: null, lastSeenAt: { $gte: cutoff } })
    .sort({ lastSeenAt: -1 })
    .limit(200)
    .lean();

  const byUser = new Map();
  for (const s of open) {
    const key = String(s.userId);
    const prev = byUser.get(key);
    if (!prev || s.lastSeenAt > prev.lastSeenAt) {
      byUser.set(key, s);
    }
  }
  const ids = [...byUser.keys()].map((id) => new mongoose.Types.ObjectId(id));
  const users = await User.find({ _id: { $in: ids } })
    .select("name email plan role")
    .lean();
  const nameById = new Map(users.map((u) => [String(u._id), u]));

  const online = [...byUser.entries()]
    .map(([id, s]) => {
      const u = nameById.get(id);
      if (!u) return null;
      return {
        userId: id,
        name: u.name,
        email: u.email,
        plan: u.plan,
        role: u.role,
        device: s.device,
        ip: s.ip,
        since: s.startedAt,
        lastSeenAt: s.lastSeenAt,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt));

  res.json({ online, count: online.length, windowMs: env.presenceWindowMs });
});

/** Recent sessions — global feed, or one user's history with ?userId=. */
export const adminSessions = asyncHandler(async (req, res) => {
  const q = {};
  const userId = asId(req.query.userId);
  if (userId) q.userId = userId;
  if (req.query.before) q.startedAt = { $lt: new Date(req.query.before) };

  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const rows = await UserSession.find(q).sort({ startedAt: -1 }).limit(limit).lean();

  let nameById = new Map();
  if (!userId) {
    const ids = [...new Set(rows.map((r) => String(r.userId)))];
    const users = await User.find({ _id: { $in: ids } }).select("name email").lean();
    nameById = new Map(users.map((u) => [String(u._id), u]));
  }

  const cutoff = presenceCutoff().getTime();
  const items = rows.map((s) => ({
    id: String(s._id),
    userId: String(s.userId),
    user: nameById.get(String(s.userId)) || undefined,
    device: s.device,
    ip: s.ip,
    startedAt: s.startedAt,
    lastSeenAt: s.lastSeenAt,
    endedAt: s.endedAt,
    endReason: s.endReason,
    durationMs:
      new Date(s.endedAt ?? s.lastSeenAt).getTime() -
      new Date(s.startedAt).getTime(),
    online: !s.endedAt && new Date(s.lastSeenAt).getTime() >= cutoff,
  }));

  res.json({ items });
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const adminListUsers = asyncHandler(async (req, res) => {
  const q = escapeRegex(str(req.query.q).trim()).slice(0, 100);
  const filter = q
    ? {
        $or: [
          { email: { $regex: q, $options: "i" } },
          { name: { $regex: q, $options: "i" } },
        ],
      }
    : {};

  const status = str(req.query.status);
  if (status === "suspended") filter.suspendedAt = { $ne: null };
  else if (status === "locked") filter.lockedUntil = { $gt: new Date() };
  else if (status === "comped") {
    filter["comp.plan"] = { $ne: null };
    filter.$or = [
      { "comp.expiresAt": null },
      { "comp.expiresAt": { $gt: new Date() } },
    ];
  } else if (status === "admin") filter.role = "admin";

  const plan = str(req.query.plan);
  if (["free", "pro", "max"].includes(plan)) filter.plan = plan;

  const page = Math.max(Number(req.query.page) || 1, 1);
  const pageSize = 25;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select(
        "name email plan role subscriptionStatus emailVerified createdAt lockedUntil trialEndsAt comp suspendedAt isRootAdmin"
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    User.countDocuments(filter),
  ]);

  // annotate with live presence
  const cutoff = presenceCutoff();
  const onlineIds = new Set(
    (
      await UserSession.distinct("userId", {
        userId: { $in: users.map((u) => u._id) },
        endedAt: null,
        lastSeenAt: { $gte: cutoff },
      })
    ).map(String)
  );
  for (const u of users) u.online = onlineIds.has(String(u._id));

  res.json({ users, total, page, pages: Math.max(Math.ceil(total / pageSize), 1) });
});

export const adminGetUser = asyncHandler(async (req, res) => {
  const id = asId(req.params.id);
  if (!id) throw ApiError.notFound("User not found");
  const user = await User.findById(id).lean();
  if (!user) throw ApiError.notFound("User not found");

  const uid = new mongoose.Types.ObjectId(id);
  const cutoff = presenceCutoff();
  const [documents, chats, queries, openSessions, lastSession, activity] =
    await Promise.all([
      Document.countDocuments({ userId: uid }),
      ChatSession.countDocuments({ userId: uid }),
      UsageEvent.countDocuments({ userId: uid, kind: "query" }),
      UserSession.countDocuments({
        userId: uid,
        endedAt: null,
        lastSeenAt: { $gte: cutoff },
      }),
      UserSession.findOne({ userId: uid }).sort({ lastSeenAt: -1 }).lean(),
      ActivityLog.find({ userId: uid }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);

  delete user.passwordHash;
  delete user.geminiApiKey;

  res.json({
    user,
    stats: { documents, chats, queries },
    presence: {
      online: openSessions > 0,
      openSessions,
      lastSeenAt: lastSession?.lastSeenAt ?? null,
      lastDevice: lastSession?.device ?? null,
    },
    activity,
  });
});

/**
 * Legacy direct field patch — kept for backward compatibility.
 * `plan`, `unlock`, `emailVerified`. New workflows use the dedicated
 * grant / suspend / role endpoints below.
 */
export const adminUpdateUser = asyncHandler(async (req, res) => {
  const user = await loadTarget(req, { protectRoot: true, protectSelf: true });

  const patch = {};
  if (["free", "pro", "max"].includes(req.body?.plan)) {
    patch.plan = req.body.plan;
    patch.subscriptionStatus = req.body.plan === "free" ? "none" : "active";
  }
  if (req.body?.unlock === true) {
    patch.lockedUntil = null;
    patch.failedLoginAttempts = 0;
  }
  if (typeof req.body?.emailVerified === "boolean") {
    patch.emailVerified = req.body.emailVerified;
  }
  if (!Object.keys(patch).length) throw ApiError.badRequest("nothing to update");

  Object.assign(user, patch);
  await user.save();

  logActivity(req.adminUser._id, "admin.user_updated", `${user.email} ${JSON.stringify(patch)}`, req);
  audit(req, "user.update", user, patch);
  if (patch.plan) {
    void notify(user._id, {
      type: "plan_changed",
      title: `Your plan is now ${patch.plan.toUpperCase()}`,
      body: "An administrator changed your plan.",
      link: "/app/settings?tab=billing",
    });
  }
  res.json({ user: user.toJSON() });
});

/** Grant complimentary plan access. Body: { plan, days?, reason? }. */
export const adminGrant = asyncHandler(async (req, res) => {
  const user = await loadTarget(req, { protectRoot: false, protectSelf: false });
  const plan = str(req.body?.plan);
  if (!["pro", "max"].includes(plan)) {
    throw ApiError.badRequest("plan must be 'pro' or 'max'");
  }
  const days = req.body?.days == null ? null : Math.min(Math.max(Number(req.body.days) || 0, 1), 3650);
  const reason = str(req.body?.reason).trim().slice(0, 280) || null;

  user.comp = {
    plan,
    expiresAt: days ? new Date(Date.now() + days * DAY) : null,
    reason,
    grantedBy: req.adminUser._id,
    grantedAt: new Date(),
  };
  await user.save();

  logActivity(req.adminUser._id, "admin.grant", `${user.email} ${plan}${days ? ` ${days}d` : " permanent"}`, req);
  audit(req, "user.grant", user, { plan, days, reason });
  void notify(user._id, {
    type: "plan_changed",
    title: `You've been given ${plan.toUpperCase()} access`,
    body: days
      ? `Complimentary ${plan.toUpperCase()} for ${days} days.${reason ? ` (${reason})` : ""}`
      : `Complimentary ${plan.toUpperCase()} access.${reason ? ` (${reason})` : ""}`,
    link: "/app/settings?tab=billing",
    email: true,
  });

  res.json({ user: user.toJSON() });
});

export const adminRevokeGrant = asyncHandler(async (req, res) => {
  const user = await loadTarget(req, { protectRoot: false, protectSelf: false });
  if (!user.comp?.plan) throw ApiError.badRequest("This user has no complimentary access");
  const had = user.comp.plan;
  user.comp = { plan: null, expiresAt: null, reason: null, grantedBy: null, grantedAt: null };
  await user.save();

  logActivity(req.adminUser._id, "admin.revoke_grant", user.email, req);
  audit(req, "user.revoke_grant", user, { had });
  void notify(user._id, {
    type: "plan_changed",
    title: "Your complimentary access ended",
    body: "You're back on the plan tied to your billing. Upgrade any time to keep higher limits.",
    link: "/app/settings?tab=billing",
  });
  res.json({ user: user.toJSON() });
});

export const adminSuspend = asyncHandler(async (req, res) => {
  const user = await loadTarget(req);
  const reason = str(req.body?.reason).trim().slice(0, 280) || null;

  user.suspendedAt = new Date();
  user.suspendedReason = reason;
  user.suspendedBy = req.adminUser._id;
  await user.save();
  await revokeAllForUser(user._id, "admin");

  logActivity(req.adminUser._id, "admin.suspend", `${user.email}${reason ? ` — ${reason}` : ""}`, req);
  audit(req, "user.suspend", user, { reason });
  res.json({ user: user.toJSON() });
});

export const adminUnsuspend = asyncHandler(async (req, res) => {
  const user = await loadTarget(req, { protectRoot: false });
  user.suspendedAt = null;
  user.suspendedReason = null;
  user.suspendedBy = null;
  await user.save();

  logActivity(req.adminUser._id, "admin.unsuspend", user.email, req);
  audit(req, "user.unsuspend", user);
  void notify(user._id, {
    type: "system",
    title: "Your account has been reinstated",
    body: "You can sign in again. Sorry for the interruption.",
  });
  res.json({ user: user.toJSON() });
});

/** Force sign-out on every device. */
export const adminForceLogout = asyncHandler(async (req, res) => {
  const user = await loadTarget(req, { protectRoot: true, protectSelf: false });
  await revokeAllForUser(user._id, "admin");
  logActivity(req.adminUser._id, "admin.force_logout", user.email, req);
  audit(req, "user.force_logout", user);
  res.json({ ok: true });
});

/**
 * Issue a one-time temporary password. Returned exactly once, never stored in
 * the clear, never logged. The user must set a new password on next sign-in.
 */
export const adminTempPassword = asyncHandler(async (req, res) => {
  const user = await loadTarget(req, { protectRoot: true, protectSelf: false });

  const chunk = () => crypto.randomBytes(3).toString("hex");
  const tempPassword = `Rv-${chunk()}-${chunk()}-${chunk()}`;

  user.passwordHash = await bcrypt.hash(tempPassword, 12);
  user.mustChangePassword = true;
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  await user.save();
  await revokeAllForUser(user._id, "password_reset");

  logActivity(req.adminUser._id, "admin.temp_password", user.email, req);
  audit(req, "user.temp_password", user);
  void notify(user._id, {
    type: "system",
    title: "An administrator reset your password",
    body: "Sign in with the temporary password you were given, then choose a new one.",
    email: true,
  });

  res.json({ tempPassword, mustChangePassword: true });
});

/** Email the user a normal password-reset link. */
export const adminSendReset = asyncHandler(async (req, res) => {
  const user = await loadTarget(req, { protectRoot: false, protectSelf: false });
  const raw = await issueToken(user._id, "password_reset");
  const url = `${env.appUrl}/reset-password?token=${raw}`;
  const tpl = resetPasswordTemplate({ name: user.name, url });
  await sendMail({ to: user.email, ...tpl }).catch((err) =>
    console.error("[admin] reset email failed:", err.message)
  );
  logActivity(req.adminUser._id, "admin.send_reset", user.email, req);
  audit(req, "user.send_reset", user);
  res.json({ ok: true, emailed: mailEnabled });
});

/** Promote / demote an admin. Root admin only (route-guarded). */
export const adminSetRole = asyncHandler(async (req, res) => {
  const user = await loadTarget(req, { protectRoot: true, protectSelf: true });
  const role = str(req.body?.role);
  if (!["user", "admin"].includes(role)) throw ApiError.badRequest("role must be 'user' or 'admin'");

  user.role = role;
  user.adminSince = role === "admin" ? user.adminSince || new Date() : null;
  await user.save();

  logActivity(req.adminUser._id, "admin.set_role", `${user.email} -> ${role}`, req);
  audit(req, "user.set_role", user, { role });
  void notify(user._id, {
    type: "system",
    title: role === "admin" ? "You're now an administrator" : "Your admin access was removed",
    body:
      role === "admin"
        ? "You have access to the admin console."
        : "Your account is back to a standard account.",
  });
  res.json({ user: user.toJSON() });
});

/** CSV export of the user list (respects the same filters as the table). */
export const adminExportUsers = asyncHandler(async (req, res) => {
  const rows = await User.find({})
    .select("name email plan role subscriptionStatus emailVerified createdAt comp suspendedAt")
    .sort({ createdAt: -1 })
    .limit(50000)
    .lean();

  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = "email,name,plan,comp_plan,comp_expires,role,subscription,email_verified,suspended,joined";
  const lines = rows.map((u) =>
    [
      u.email,
      u.name,
      u.plan,
      u.comp?.plan || "",
      u.comp?.expiresAt ? new Date(u.comp.expiresAt).toISOString() : "",
      u.role,
      u.subscriptionStatus,
      u.emailVerified,
      u.suspendedAt ? "yes" : "",
      new Date(u.createdAt).toISOString(),
    ]
      .map(esc)
      .join(",")
  );

  audit(req, "users.export", null, { count: rows.length });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="retrivo-users-${Date.now()}.csv"`
  );
  res.send([header, ...lines].join("\n"));
});

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export const adminAuditLog = asyncHandler(async (req, res) => {
  const items = await listAudit({
    limit: Number(req.query.limit) || 50,
    before: req.query.before,
    action: str(req.query.action) || undefined,
  });
  res.json({ items });
});

// ---------------------------------------------------------------------------
// Broadcasts
// ---------------------------------------------------------------------------

export const adminAudienceList = asyncHandler(async (_req, res) => {
  res.json({ audiences: AUDIENCES, pushEnabled });
});

export const adminAudienceCount = asyncHandler(async (req, res) => {
  const audience = str(req.query.audience) || "all";
  const count = await countAudience(audience);
  res.json({ audience, count });
});

export const adminListBroadcasts = asyncHandler(async (req, res) => {
  const items = await listBroadcasts(Number(req.query.limit) || 30);
  res.json({ items });
});

export const adminCreateBroadcast = asyncHandler(async (req, res) => {
  const title = str(req.body?.title).trim().slice(0, 140);
  const body = str(req.body?.body).trim().slice(0, 2000);
  const linkRaw = str(req.body?.link).trim().slice(0, 300);
  const link = linkRaw && linkRaw.startsWith("/") ? linkRaw : null;
  let audience = str(req.body?.audience) || "all";

  if (!title) throw ApiError.badRequest("A title is required");

  if (audience === "user") {
    const uid = asId(req.body?.userId);
    if (!uid) throw ApiError.badRequest("userId is required for a single-user broadcast");
    audience = `user:${uid}`;
  }
  const known =
    AUDIENCES[audience] ||
    (audience.startsWith("user:") && asId(audience.slice(5)));
  if (!known) throw ApiError.badRequest("Unknown audience");

  const channels = {
    inApp: req.body?.channels?.inApp !== false,
    email: req.body?.channels?.email === true,
    push: req.body?.channels?.push === true && pushEnabled,
  };

  const row = await sendBroadcast({
    admin: req.adminUser,
    audience,
    title,
    body,
    link,
    channels,
  });

  logActivity(req.adminUser._id, "admin.broadcast", `${audience} "${title}"`, req);
  audit(req, "broadcast.send", null, {
    audience,
    title,
    channels,
    recipients: row.recipientCount,
  });
  res.status(201).json({ broadcast: row.toJSON() });
});
