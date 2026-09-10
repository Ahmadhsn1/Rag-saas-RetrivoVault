import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Document } from "../models/Document.js";
import { Collection } from "../models/Collection.js";
import { ChatSession } from "../models/ChatSession.js";
import { UserSession } from "../models/UserSession.js";
import { planFor } from "../config/plans.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import { str } from "../middleware/sanitize.js";
import { listActivity, logActivity } from "../services/activityLog.js";
import { revokeFamily } from "../services/refreshTokens.js";
import { presenceCutoff } from "../services/presence.js";

export const updateProfile = asyncHandler(async (req, res) => {
  const name = str(req.body?.name).trim();
  if (!name) throw ApiError.badRequest("name is required");

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name },
    { new: true, runValidators: true }
  );
  if (!user) throw ApiError.unauthorized();
  logActivity(user._id, "account.profile_updated", null, req);
  res.json({ user: user.toJSON() });
});

export const updateNotificationPrefs = asyncHandler(async (req, res) => {
  const allowed = [
    "ingestComplete",
    "quotaWarnings",
    "weeklyDigest",
    "productUpdates",
  ];
  const patch = {};
  for (const k of allowed) {
    if (typeof req.body?.[k] === "boolean") patch[`notificationPrefs.${k}`] = req.body[k];
  }
  if (!Object.keys(patch).length) throw ApiError.badRequest("nothing to update");

  const user = await User.findByIdAndUpdate(req.user.id, patch, { new: true });
  if (!user) throw ApiError.unauthorized();
  res.json({ notificationPrefs: user.notificationPrefs });
});

// Bring-your-own Gemini key (paid plans only).
export const setGeminiKey = asyncHandler(async (req, res) => {
  const key = str(req.body?.key).trim();
  if (!key || key.length < 20) throw ApiError.badRequest("That doesn't look like a valid key");

  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.unauthorized();
  if (!planFor(user).features.byoKey) {
    throw new ApiError(403, "Bringing your own key requires a paid plan.", {
      code: "feature_locked",
    });
  }

  user.geminiApiKey = key;
  user.hasGeminiKey = true;
  await user.save();
  logActivity(user._id, "account.gemini_key_set", null, req);
  res.json({ hasGeminiKey: true });
});

export const clearGeminiKey = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, {
    geminiApiKey: null,
    hasGeminiKey: false,
  });
  res.status(204).end();
});

/** The signed-in user's own devices / sessions (GitHub-style). */
export const getSessions = asyncHandler(async (req, res) => {
  const cutoff = presenceCutoff().getTime();
  const rows = await UserSession.find({ userId: req.user.id })
    .sort({ lastSeenAt: -1 })
    .limit(50)
    .lean();

  const items = rows.map((s) => ({
    id: String(s._id),
    family: s.family,
    device: s.device,
    ip: s.ip,
    startedAt: s.startedAt,
    lastSeenAt: s.lastSeenAt,
    endedAt: s.endedAt,
    current: Boolean(req.user.family && s.family === req.user.family),
    online:
      !s.endedAt && new Date(s.lastSeenAt).getTime() >= cutoff,
  }));

  res.json({ items });
});

/** Revoke one of the user's own sessions by family id. */
export const revokeSession = asyncHandler(async (req, res) => {
  const family = str(req.params.family);
  if (family && family === req.user.family) {
    throw ApiError.badRequest("Use sign out to end the current session");
  }
  await revokeFamily(req.user.id, family, "revoked");
  logActivity(req.user.id, "account.session_revoked", family, req);
  res.status(204).end();
});

export const getActivity = asyncHandler(async (req, res) => {
  const items = await listActivity(req.user.id, {
    limit: Number(req.query.limit) || 50,
    before: req.query.before,
  });
  res.json({ items });
});

/** Full data export — everything the user owns, as one JSON document. */
export const exportData = asyncHandler(async (req, res) => {
  const uid = new mongoose.Types.ObjectId(req.user.id);
  const [user, collections, documents, chats] = await Promise.all([
    User.findById(uid),
    Collection.find({ userId: uid }).lean(),
    Document.find({ userId: uid })
      .select("-__v")
      .lean(),
    ChatSession.find({ userId: uid }).select("-__v").lean(),
  ]);

  logActivity(req.user.id, "account.data_exported", null, req);

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="retrivo-vault-export-${Date.now()}.json"`
  );
  res.json({
    exportedAt: new Date().toISOString(),
    account: user?.toJSON(),
    collections,
    documents,
    chats,
  });
});
