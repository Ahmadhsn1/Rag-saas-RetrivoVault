// Individual-only plans. Limits are enforced by middleware/quota.js.
// Stripe price IDs come from env (see config/env.js).
import { env } from "./env.js";

export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    limits: {
      documents: 20,
      storageBytes: 50 * 1024 * 1024,
      queriesPerMonth: 100,
      collections: 3,
      apiKeys: 0,
    },
    features: { byoKey: false, apiAccess: false, priorityQueue: false },
  },
  pro: {
    id: "pro",
    name: "Pro",
    limits: {
      documents: 500,
      storageBytes: 2 * 1024 * 1024 * 1024,
      queriesPerMonth: 3000,
      collections: 50,
      apiKeys: 0,
    },
    features: { byoKey: true, apiAccess: false, priorityQueue: true },
    prices: {
      monthly: env.stripe.priceProMonthly,
      annual: env.stripe.priceProAnnual,
    },
  },
  max: {
    id: "max",
    name: "Max",
    limits: {
      documents: 5000,
      storageBytes: 20 * 1024 * 1024 * 1024,
      queriesPerMonth: 20000,
      collections: 500,
      apiKeys: 10,
    },
    features: { byoKey: true, apiAccess: true, priorityQueue: true },
    prices: {
      monthly: env.stripe.priceMaxMonthly,
      annual: env.stripe.priceMaxAnnual,
    },
  },
};

export const getPlan = (id) => PLANS[id] || PLANS.free;

// The plan config in force for a user right now (respects an active trial).
export const planFor = (user) =>
  getPlan(typeof user?.effectivePlan === "function" ? user.effectivePlan() : user?.plan);

export const TRIAL_DAYS = Number(process.env.TRIAL_DAYS || 14);
export const TRIAL_PLAN = "pro";

// Map a Stripe price id back to a plan id.
export function planForPrice(priceId) {
  for (const plan of Object.values(PLANS)) {
    if (!plan.prices) continue;
    if (priceId === plan.prices.monthly || priceId === plan.prices.annual) {
      return plan.id;
    }
  }
  return null;
}

// Which env price ids are configured (for the checkout endpoint to validate).
export function priceIsKnown(priceId) {
  return planForPrice(priceId) !== null;
}
