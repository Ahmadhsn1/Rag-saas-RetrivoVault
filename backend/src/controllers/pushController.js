import { asyncHandler, ApiError } from "../utils/ApiError.js";
import { str } from "../middleware/sanitize.js";
import { PushSubscription } from "../models/PushSubscription.js";
import { pushIsEnabled, vapidPublicKey } from "../services/pushService.js";

/** Public: what the browser needs to call PushManager.subscribe(). */
export const getPushConfig = asyncHandler(async (_req, res) => {
  res.json({ enabled: pushIsEnabled(), vapidPublicKey: vapidPublicKey() });
});

/** Register (or refresh) this device's push subscription. */
export const subscribePush = asyncHandler(async (req, res) => {
  if (!pushIsEnabled()) throw ApiError.badRequest("Push notifications are not enabled");

  const sub = req.body?.subscription ?? req.body;
  const endpoint = str(sub?.endpoint).trim();
  const p256dh = str(sub?.keys?.p256dh).trim();
  const auth = str(sub?.keys?.auth).trim();
  if (!/^https:\/\//.test(endpoint) || !p256dh || !auth) {
    throw ApiError.badRequest("Invalid push subscription");
  }

  await PushSubscription.findOneAndUpdate(
    { endpoint },
    {
      userId: req.user.id,
      endpoint,
      keys: { p256dh, auth },
      userAgent: req.headers["user-agent"]?.slice(0, 300) ?? null,
      lastUsedAt: null,
    },
    { upsert: true, new: true }
  );

  res.status(201).json({ ok: true });
});

/** Remove this device's subscription. */
export const unsubscribePush = asyncHandler(async (req, res) => {
  const endpoint = str(req.body?.endpoint).trim();
  if (endpoint) {
    await PushSubscription.deleteOne({ endpoint, userId: req.user.id });
  }
  res.status(204).end();
});
