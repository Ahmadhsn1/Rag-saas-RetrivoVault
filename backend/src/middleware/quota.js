import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Document } from "../models/Document.js";
import { Collection } from "../models/Collection.js";
import { getPlan } from "../config/plans.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import { rollUsageWindow } from "../services/usage.js";

const quotaError = (msg) =>
  new ApiError(402, msg, { code: "quota_exceeded" });

/** Blocks document uploads that would exceed the plan's document or storage cap. */
export const enforceDocumentQuota = asyncHandler(async (req, _res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.unauthorized();
  const limits = getPlan(user.plan).limits;

  const uid = new mongoose.Types.ObjectId(req.user.id);
  const [agg] = await Document.aggregate([
    { $match: { userId: uid } },
    { $group: { _id: null, count: { $sum: 1 }, bytes: { $sum: "$sizeBytes" } } },
  ]);
  const count = agg?.count ?? 0;
  const bytes = agg?.bytes ?? 0;
  const incoming = req.file?.size ?? 0;

  if (count >= limits.documents) {
    throw quotaError(
      `You've reached the ${limits.documents}-document limit on the ${user.plan} plan. Upgrade for more.`
    );
  }
  if (bytes + incoming > limits.storageBytes) {
    throw quotaError(
      `This upload would exceed your storage limit on the ${user.plan} plan. Upgrade for more.`
    );
  }
  next();
});

export const enforceCollectionQuota = asyncHandler(async (req, _res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.unauthorized();
  const limits = getPlan(user.plan).limits;

  const count = await Collection.countDocuments({ userId: req.user.id });
  if (count >= limits.collections) {
    throw quotaError(
      `You've reached the ${limits.collections}-collection limit on the ${user.plan} plan.`
    );
  }
  next();
});

export const enforceQueryQuota = asyncHandler(async (req, _res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.unauthorized();
  await rollUsageWindow(user);

  const limits = getPlan(user.plan).limits;
  if (user.usage.queriesThisPeriod >= limits.queriesPerMonth) {
    throw quotaError(
      `You've used all ${limits.queriesPerMonth} questions in your monthly allowance on the ${user.plan} plan. Upgrade or wait for the reset.`
    );
  }
  req.planUser = user;
  next();
});

/** Gate a feature (e.g. API access, BYO key) behind a plan capability. */
export const requireFeature = (feature) =>
  asyncHandler(async (req, _res, next) => {
    const user = req.planUser || (await User.findById(req.user.id));
    if (!user) throw ApiError.unauthorized();
    if (!getPlan(user.plan).features[feature]) {
      throw new ApiError(
        403,
        `The "${feature}" capability requires a higher plan.`,
        { code: "feature_locked" }
      );
    }
    next();
  });
