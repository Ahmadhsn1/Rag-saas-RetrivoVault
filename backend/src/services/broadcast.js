import { User } from "../models/User.js";
import { UserSession } from "../models/UserSession.js";
import { Broadcast } from "../models/Broadcast.js";
import { Notification } from "../models/Notification.js";
import { PushSubscription } from "../models/PushSubscription.js";
import { sendMail } from "./mailer.js";
import { pushToUser } from "./pushService.js";
import { presenceCutoff } from "./presence.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const DAY = 24 * 60 * 60 * 1000;

export const AUDIENCES = {
  all: "Everyone",
  "plan:free": "Free plan",
  "plan:pro": "Pro plan",
  "plan:max": "Max plan",
  comped: "Complimentary access",
  online: "Online now",
  active7d: "Active in last 7 days",
};

export function audienceLabel(audience) {
  if (AUDIENCES[audience]) return AUDIENCES[audience];
  if (audience.startsWith("user:")) return "One user";
  return audience;
}

/** Resolve an audience string to a Mongo filter on the User collection. */
async function audienceFilter(audience) {
  if (audience === "all") return {};
  if (audience.startsWith("plan:")) {
    const plan = audience.slice(5);
    // effective plan can't be expressed in one query — approximate with the
    // stored plan plus (for pro/max) live comps; good enough for targeting.
    if (plan === "free") {
      return { plan: "free", "comp.plan": null };
    }
    return {
      $or: [
        { plan },
        {
          "comp.plan": plan,
          $or: [{ "comp.expiresAt": null }, { "comp.expiresAt": { $gt: new Date() } }],
        },
      ],
    };
  }
  if (audience === "comped") {
    return {
      "comp.plan": { $ne: null },
      $or: [{ "comp.expiresAt": null }, { "comp.expiresAt": { $gt: new Date() } }],
    };
  }
  if (audience === "online") {
    const ids = await UserSession.distinct("userId", {
      endedAt: null,
      lastSeenAt: { $gte: presenceCutoff() },
    });
    return { _id: { $in: ids } };
  }
  if (audience === "active7d") {
    const ids = await UserSession.distinct("userId", {
      lastSeenAt: { $gte: new Date(Date.now() - 7 * DAY) },
    });
    return { _id: { $in: ids } };
  }
  if (audience.startsWith("user:")) {
    return { _id: audience.slice(5) };
  }
  return { _id: null }; // unknown -> nobody
}

export async function countAudience(audience) {
  const filter = await audienceFilter(audience).catch(() => ({ _id: null }));
  return User.countDocuments(filter);
}

/**
 * Create the Broadcast row and fan out delivery in the background. Returns the
 * row immediately (status "sending"); it flips to "sent" when the fan-out ends.
 */
export async function sendBroadcast({
  admin,
  audience,
  title,
  body = "",
  link = null,
  channels = { inApp: true, email: false, push: false },
}) {
  const filter = await audienceFilter(audience);
  const recipients = await User.find(filter).select("_id email notificationPrefs").lean();

  const row = await Broadcast.create({
    sentBy: admin._id,
    sentByEmail: admin.email,
    title,
    body,
    link,
    audience,
    audienceLabel: audienceLabel(audience),
    channels,
    recipientCount: recipients.length,
    status: "sending",
  });

  // Fan out without blocking the request. Single-instance, same as the
  // scheduler — chunk to keep memory/DB pressure bounded.
  void fanOut(row, recipients, { title, body, link, channels }).catch((err) => {
    logger.error({ err, broadcast: String(row._id) }, "broadcast fan-out failed");
    Broadcast.updateOne(
      { _id: row._id },
      { status: "failed", error: err.message, finishedAt: new Date() }
    ).catch(() => {});
  });

  return row;
}

async function fanOut(row, recipients, { title, body, link, channels }) {
  const tally = { inApp: 0, email: 0, push: 0 };
  const CHUNK = 200;
  const url = link ? `${env.appUrl}${link}` : env.appUrl;

  for (let i = 0; i < recipients.length; i += CHUNK) {
    const slice = recipients.slice(i, i + CHUNK);

    if (channels.inApp) {
      const docs = slice.map((u) => ({
        userId: u._id,
        type: "announcement",
        title,
        body,
        link,
      }));
      await Notification.insertMany(docs, { ordered: false }).catch(() => {});
      tally.inApp += slice.length;
    }

    await Promise.all(
      slice.map(async (u) => {
        if (channels.email && u.notificationPrefs?.productUpdates !== false) {
          const ok = await sendMail({
            to: u.email,
            subject: title,
            text: `${body}\n\n${url}`,
          }).then(() => true).catch(() => false);
          if (ok) tally.email += 1;
        }
        if (channels.push) {
          const n = await pushToUser(u._id, { title, body, link }).catch(() => 0);
          tally.push += n;
        }
      })
    );
  }

  await Broadcast.updateOne(
    { _id: row._id },
    { status: "sent", delivered: tally, finishedAt: new Date() }
  );
  logger.info(
    { broadcast: String(row._id), recipients: recipients.length, tally },
    "broadcast sent"
  );
}

export async function listBroadcasts(limit = 30) {
  return Broadcast.find({})
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(Number(limit) || 30, 1), 100))
    .lean();
}

export async function pushSubscriberCount() {
  return PushSubscription.estimatedDocumentCount();
}
