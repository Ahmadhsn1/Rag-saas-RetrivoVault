import { Webhook, newWebhookSecret, WEBHOOK_EVENTS } from "../models/Webhook.js";
import { User } from "../models/User.js";
import { planFor } from "../config/plans.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import { str } from "../middleware/sanitize.js";
import { assertPublicHttpsUrl } from "../utils/safeUrl.js";

const assertHttps = (url) => assertPublicHttpsUrl(str(url));

export const listWebhooks = asyncHandler(async (req, res) => {
  const webhooks = await Webhook.find({ userId: req.user.id }).sort({
    createdAt: -1,
  });
  res.json({ webhooks, events: WEBHOOK_EVENTS });
});

export const createWebhook = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.unauthorized();
  if (!planFor(user).features.apiAccess) {
    throw new ApiError(403, "Webhooks require the Max plan.", {
      code: "feature_locked",
    });
  }

  const { url } = req.body || {};
  if (!url) throw ApiError.badRequest("url is required");
  assertHttps(url);

  const events = Array.isArray(req.body?.events)
    ? req.body.events.filter((e) => WEBHOOK_EVENTS.includes(e))
    : WEBHOOK_EVENTS;

  if ((await Webhook.countDocuments({ userId: req.user.id })) >= 5) {
    throw new ApiError(402, "You can have at most 5 webhooks.", {
      code: "quota_exceeded",
    });
  }

  const secret = newWebhookSecret();
  const hook = await Webhook.create({
    userId: req.user.id,
    url,
    events: events.length ? events : WEBHOOK_EVENTS,
    secret,
  });
  res.status(201).json({ webhook: hook, secret });
});

export const updateWebhook = asyncHandler(async (req, res) => {
  const patch = {};
  if (typeof req.body?.active === "boolean") patch.active = req.body.active;
  if (typeof req.body?.url === "string") {
    assertHttps(req.body.url);
    patch.url = req.body.url;
    patch.failureCount = 0;
  }
  if (Array.isArray(req.body?.events)) {
    patch.events = req.body.events.filter((e) => WEBHOOK_EVENTS.includes(e));
  }
  const hook = await Webhook.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    patch,
    { new: true }
  );
  if (!hook) throw ApiError.notFound("Webhook not found");
  res.json({ webhook: hook });
});

export const deleteWebhook = asyncHandler(async (req, res) => {
  const r = await Webhook.deleteOne({
    _id: req.params.id,
    userId: req.user.id,
  });
  if (!r.deletedCount) throw ApiError.notFound("Webhook not found");
  res.status(204).end();
});
