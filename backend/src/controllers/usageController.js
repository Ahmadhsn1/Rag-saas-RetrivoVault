import { asyncHandler } from "../utils/ApiError.js";
import { getUsageSnapshot, getUsageSeries } from "../services/usage.js";

export const getUsage = asyncHandler(async (req, res) => {
  const snapshot = await getUsageSnapshot(req.user.id);
  res.json(snapshot);
});

export const getUsageChart = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 7), 90);
  const series = await getUsageSeries(req.user.id, days);
  res.json({ series, days });
});
