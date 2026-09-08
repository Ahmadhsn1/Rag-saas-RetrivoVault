import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { sendMail } from "./mailer.js";
import { env } from "../config/env.js";

const PREF_BY_TYPE = {
  ingest_complete: "ingestComplete",
  ingest_failed: "ingestComplete",
  quota_warning: "quotaWarnings",
  trial_ending: "productUpdates",
  plan_changed: "productUpdates",
  welcome: null, // always
  system: null,
};

/**
 * Create an in-app notification and optionally email it, respecting the user's
 * notification preferences. Never throws into the caller.
 */
export async function notify(
  userId,
  { type, title, body = "", link = null, email = false }
) {
  try {
    await Notification.create({ userId, type, title, body, link });

    if (email) {
      const user = await User.findById(userId).lean();
      const prefKey = PREF_BY_TYPE[type];
      const allowed = !prefKey || user?.notificationPrefs?.[prefKey] !== false;
      if (user && allowed) {
        const url = link ? `${env.appUrl}${link}` : env.appUrl;
        await sendMail({
          to: user.email,
          subject: title,
          text: `${body}\n\n${url}`,
        }).catch(() => {});
      }
    }
  } catch {
    /* notifications are best-effort */
  }
}

export async function listNotifications(userId, { limit = 30, unreadOnly } = {}) {
  const q = { userId };
  if (unreadOnly) q.readAt = null;
  const [items, unread] = await Promise.all([
    Notification.find(q).sort({ createdAt: -1 }).limit(Math.min(limit, 100)).lean(),
    Notification.countDocuments({ userId, readAt: null }),
  ]);
  return { items, unread };
}

export async function markRead(userId, ids) {
  const q = { userId, readAt: null };
  if (Array.isArray(ids) && ids.length) q._id = { $in: ids };
  await Notification.updateMany(q, { readAt: new Date() });
}
