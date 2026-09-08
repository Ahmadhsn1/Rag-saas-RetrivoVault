import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Document } from "../models/Document.js";
import { Collection } from "../models/Collection.js";
import { UsageEvent } from "../models/UsageEvent.js";
import { planFor } from "../config/plans.js";

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/** Roll the monthly query window forward if it's stale. Returns the user doc. */
export async function rollUsageWindow(user) {
  const start = user.usage?.periodStart?.getTime() ?? 0;
  if (Date.now() - start > MONTH_MS) {
    user.usage.queriesThisPeriod = 0;
    user.usage.periodStart = new Date();
    await user.save();
  }
  return user;
}

export async function recordEvent(userId, kind, amount = 1, meta = {}) {
  await UsageEvent.create({ userId, kind, amount, meta });
}

export async function incrementQueryCount(userId) {
  await User.updateOne(
    { _id: userId },
    { $inc: { "usage.queriesThisPeriod": 1 } }
  );
}

/** A full snapshot of the user's usage vs. their plan limits. */
export async function getUsageSnapshot(userId) {
  const user = await User.findById(userId);
  if (!user) return null;
  await rollUsageWindow(user);

  const uid = new mongoose.Types.ObjectId(userId);
  const [docAgg] = await Document.aggregate([
    { $match: { userId: uid } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        bytes: { $sum: "$sizeBytes" },
      },
    },
  ]);
  const collections = await Collection.countDocuments({ userId: uid });

  const limits = planFor(user).limits;
  const documents = docAgg?.count ?? 0;
  const storageBytes = docAgg?.bytes ?? 0;
  const queries = user.usage.queriesThisPeriod;

  return {
    plan: user.effectivePlan(),
    limits,
    current: { documents, storageBytes, collections, queries },
    remaining: {
      documents: Math.max(limits.documents - documents, 0),
      storageBytes: Math.max(limits.storageBytes - storageBytes, 0),
      collections: Math.max(limits.collections - collections, 0),
      queries: Math.max(limits.queriesPerMonth - queries, 0),
    },
    periodStart: user.usage.periodStart,
  };
}

/** Daily time-series for the usage charts. */
export async function getUsageSeries(userId, days = 30) {
  const uid = new mongoose.Types.ObjectId(userId);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await UsageEvent.aggregate([
    { $match: { userId: uid, createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          kind: "$kind",
        },
        total: { $sum: "$amount" },
      },
    },
  ]);

  const byDay = new Map();
  for (const r of rows) {
    const entry = byDay.get(r._id.day) || { date: r._id.day, query: 0, ingest: 0 };
    entry[r._id.kind] = r.total;
    byDay.set(r._id.day, entry);
  }

  // fill gaps
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    out.push(byDay.get(d) || { date: d, query: 0, ingest: 0 });
  }
  return out;
}
