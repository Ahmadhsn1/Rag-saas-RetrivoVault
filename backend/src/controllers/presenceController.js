import { asyncHandler } from "../utils/ApiError.js";
import { touchSession } from "../services/presence.js";

/**
 * Client heartbeat. The app calls this every ~60s while a tab is visible so the
 * admin console can show who's online. Cheap: one indexed updateOne.
 */
export const ping = asyncHandler(async (req, res) => {
  await touchSession({ family: req.user.family, userId: req.user.id }, req);
  res.json({ ok: true, t: Date.now() });
});
