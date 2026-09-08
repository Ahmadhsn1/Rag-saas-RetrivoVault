import { ApiKey, generateApiKey } from "../models/ApiKey.js";
import { User } from "../models/User.js";
import { planFor } from "../config/plans.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import { str } from "../middleware/sanitize.js";

export const listApiKeys = asyncHandler(async (req, res) => {
  const keys = await ApiKey.find({ userId: req.user.id, revokedAt: null }).sort({
    createdAt: -1,
  });
  res.json({ keys });
});

export const createApiKey = asyncHandler(async (req, res) => {
  const name = str(req.body?.name).trim();
  if (!name) throw ApiError.badRequest("name is required");

  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.unauthorized();
  const limit = planFor(user).limits.apiKeys;
  if (limit === 0) {
    throw new ApiError(403, "API keys require the Max plan.", {
      code: "feature_locked",
    });
  }

  const active = await ApiKey.countDocuments({
    userId: req.user.id,
    revokedAt: null,
  });
  if (active >= limit) {
    throw new ApiError(402, `You can have at most ${limit} API keys.`, {
      code: "quota_exceeded",
    });
  }

  const { raw, prefix, hash } = generateApiKey();
  const doc = await ApiKey.create({
    userId: req.user.id,
    name,
    keyHash: hash,
    prefix,
  });

  // The plaintext key is returned exactly once.
  res.status(201).json({ key: doc, secret: raw });
});

export const revokeApiKey = asyncHandler(async (req, res) => {
  const doc = await ApiKey.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id, revokedAt: null },
    { revokedAt: new Date() }
  );
  if (!doc) throw ApiError.notFound("API key not found");
  res.status(204).end();
});
