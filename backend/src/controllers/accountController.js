import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Document } from "../models/Document.js";
import { Collection } from "../models/Collection.js";
import { ChatSession } from "../models/ChatSession.js";
import { planFor } from "../config/plans.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import { listActivity, logActivity } from "../services/activityLog.js";

export const updateProfile = asyncHandler(async (req, res) => {
  const name = (req.body?.name || "").trim();
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
  const key = (req.body?.key || "").trim();
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
