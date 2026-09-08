import { User } from "../models/User.js";
import { Document } from "../models/Document.js";
import { ChatSession } from "../models/ChatSession.js";
import { UsageEvent } from "../models/UsageEvent.js";
import { PLANS } from "../config/plans.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import { str } from "../middleware/sanitize.js";
import { logActivity } from "../services/activityLog.js";
import { notify } from "../services/notifications.js";

const PRICE = { free: 0, pro: 12, max: 29 }; // rough monthly, for an MRR estimate

export const adminStats = asyncHandler(async (_req, res) => {
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [byPlan, totals, queries30, newUsers30] = await Promise.all([
    User.aggregate([{ $group: { _id: "$plan", count: { $sum: 1 } } }]),
    Promise.all([
      User.countDocuments(),
      Document.countDocuments(),
      ChatSession.countDocuments(),
    ]),
    UsageEvent.countDocuments({ kind: "query", createdAt: { $gte: since30 } }),
    User.countDocuments({ createdAt: { $gte: since30 } }),
  ]);

  const planCounts = Object.fromEntries(byPlan.map((p) => [p._id, p.count]));
  const mrr = Object.entries(planCounts).reduce(
    (sum, [plan, n]) => sum + (PRICE[plan] || 0) * n,
    0
  );

  res.json({
    users: totals[0],
    documents: totals[1],
    chats: totals[2],
    queriesLast30d: queries30,
    newUsersLast30d: newUsers30,
    planCounts,
    estimatedMrr: mrr,
    plans: Object.keys(PLANS),
  });
});

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
  const page = Math.max(Number(req.query.page) || 1, 1);
  const pageSize = 25;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("name email plan role subscriptionStatus emailVerified createdAt lockedUntil trialEndsAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({ users, total, page, pages: Math.max(Math.ceil(total / pageSize), 1) });
});

export const adminGetUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user) throw ApiError.notFound("User not found");
  const [documents, chats, queries] = await Promise.all([
    Document.countDocuments({ userId: user._id }),
    ChatSession.countDocuments({ userId: user._id }),
    UsageEvent.countDocuments({ userId: user._id, kind: "query" }),
  ]);
  delete user.passwordHash;
  delete user.geminiApiKey;
  res.json({ user, stats: { documents, chats, queries } });
});

export const adminUpdateUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.adminUser._id)) {
    throw ApiError.badRequest("You can't modify your own admin account here");
  }
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

  const user = await User.findByIdAndUpdate(req.params.id, patch, { new: true });
  if (!user) throw ApiError.notFound("User not found");

  logActivity(req.adminUser._id, "admin.user_updated", `${user.email} ${JSON.stringify(patch)}`, req);
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
