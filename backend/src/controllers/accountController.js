import { User } from "../models/User.js";
import { getPlan } from "../config/plans.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";

export const updateProfile = asyncHandler(async (req, res) => {
  const name = (req.body?.name || "").trim();
  if (!name) throw ApiError.badRequest("name is required");

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name },
    { new: true, runValidators: true }
  );
  if (!user) throw ApiError.unauthorized();
  res.json({ user: user.toJSON() });
});

// Bring-your-own Gemini key (paid plans only).
export const setGeminiKey = asyncHandler(async (req, res) => {
  const key = (req.body?.key || "").trim();
  if (!key || key.length < 20) throw ApiError.badRequest("That doesn't look like a valid key");

  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.unauthorized();
  if (!getPlan(user.plan).features.byoKey) {
    throw new ApiError(403, "Bringing your own key requires a paid plan.", {
      code: "feature_locked",
    });
  }

  user.geminiApiKey = key;
  user.hasGeminiKey = true;
  await user.save();
  res.json({ hasGeminiKey: true });
});

export const clearGeminiKey = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, {
    geminiApiKey: null,
    hasGeminiKey: false,
  });
  res.status(204).end();
});
