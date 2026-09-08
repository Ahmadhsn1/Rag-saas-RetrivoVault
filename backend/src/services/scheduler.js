import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { getUsageSnapshot } from "./usage.js";
import { notify } from "./notifications.js";
import { logger } from "../config/logger.js";

const DAY = 24 * 60 * 60 * 1000;

async function notifyTrialsEnding() {
  const soon = new Date(Date.now() + 3 * DAY);
  const users = await User.find({
    plan: "free",
    trialPlan: { $ne: null },
    trialEndsAt: { $gt: new Date(), $lte: soon },
  }).select("_id trialPlan trialEndsAt");

  for (const u of users) {
    const already = await Notification.exists({
      userId: u._id,
      type: "trial_ending",
      createdAt: { $gt: new Date(Date.now() - 7 * DAY) },
    });
    if (already) continue;
    const days = Math.max(
      1,
      Math.ceil((u.trialEndsAt.getTime() - Date.now()) / DAY)
    );
    void notify(u._id, {
      type: "trial_ending",
      title: `Your ${u.trialPlan.toUpperCase()} trial ends in ${days} day${days === 1 ? "" : "s"}`,
      body: "Upgrade to keep your higher limits, or you'll move to the Free plan.",
      link: "/app/settings?tab=billing",
      email: true,
    });
  }
}

async function notifyQuotaWarnings() {
  // Users who have used >= 85% of their monthly query allowance.
  const users = await User.find({}).select("_id notificationPrefs").limit(5000);
  for (const u of users) {
    if (u.notificationPrefs?.quotaWarnings === false) continue;
    const snap = await getUsageSnapshot(u._id).catch(() => null);
    if (!snap) continue;
    const used = snap.current.queries;
    const limit = snap.limits.queriesPerMonth;
    if (limit > 0 && used / limit >= 0.85 && used < limit) {
      const already = await Notification.exists({
        userId: u._id,
        type: "quota_warning",
        createdAt: { $gt: snap.periodStart },
      });
      if (already) continue;
      void notify(u._id, {
        type: "quota_warning",
        title: `You've used ${Math.round((used / limit) * 100)}% of your monthly questions`,
        body: `${limit - used} left before the reset. Upgrade for a higher allowance.`,
        link: "/app/settings?tab=billing",
        email: true,
      });
    }
  }
}

let timer = null;

export function startScheduler() {
  if (timer) return;
  const tick = async () => {
    try {
      await notifyTrialsEnding();
      await notifyQuotaWarnings();
    } catch (err) {
      logger.error({ err }, "scheduler tick failed");
    }
  };
  // first run shortly after boot, then every 6 hours
  setTimeout(tick, 30_000).unref();
  timer = setInterval(tick, 6 * 60 * 60 * 1000);
  timer.unref();
}

export function stopScheduler() {
  if (timer) clearInterval(timer);
  timer = null;
}
