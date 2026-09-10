import webpush from "web-push";
import { env, pushEnabled } from "../config/env.js";
import { logger } from "../config/logger.js";
import { PushSubscription } from "../models/PushSubscription.js";

let configured = false;

function ensureConfigured() {
  if (configured || !pushEnabled) return pushEnabled;
  webpush.setVapidDetails(
    env.push.subject,
    env.push.vapidPublic,
    env.push.vapidPrivate
  );
  configured = true;
  return true;
}

export function pushIsEnabled() {
  return pushEnabled;
}

export function vapidPublicKey() {
  return pushEnabled ? env.push.vapidPublic : null;
}

/**
 * Send a Web Push message to every subscription a user has registered.
 * Returns the count actually delivered. Dead subscriptions (404/410) are pruned.
 * No-op (returns 0) when VAPID isn't configured.
 */
export async function pushToUser(userId, payload) {
  if (!ensureConfigured()) return 0;

  const subs = await PushSubscription.find({ userId }).lean();
  if (!subs.length) return 0;

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body || "",
    link: payload.link || "/app",
    tag: payload.tag || "retrivo",
  });

  let delivered = 0;
  const dead = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: s.keys },
          body,
          { TTL: 60 * 60 * 24 }
        );
        delivered += 1;
      } catch (err) {
        const code = err?.statusCode;
        if (code === 404 || code === 410) dead.push(s.endpoint);
        else logger.warn({ code, endpoint: s.endpoint }, "web push failed");
      }
    })
  );

  if (dead.length) {
    await PushSubscription.deleteMany({ endpoint: { $in: dead } }).catch(() => {});
  }
  if (delivered) {
    await PushSubscription.updateMany(
      { userId },
      { $set: { lastUsedAt: new Date() } }
    ).catch(() => {});
  }
  return delivered;
}

/** Generate a VAPID key pair — used by the seed/setup script, never at runtime. */
export function generateVapidKeys() {
  return webpush.generateVAPIDKeys();
}
