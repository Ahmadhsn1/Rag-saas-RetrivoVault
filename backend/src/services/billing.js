import Stripe from "stripe";
import { env, billingEnabled } from "../config/env.js";
import { User } from "../models/User.js";
import { PLANS, planForPrice } from "../config/plans.js";

let stripe = null;
export function getStripe() {
  if (!billingEnabled) return null;
  if (!stripe) stripe = new Stripe(env.stripe.secretKey);
  return stripe;
}

/** Ensure the user has a Stripe customer; returns the customer id. */
export async function ensureCustomer(user) {
  const s = getStripe();
  if (!s) throw new Error("Billing is not configured");
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await s.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: String(user._id) },
  });
  user.stripeCustomerId = customer.id;
  await user.save();
  return customer.id;
}

export async function createCheckoutSession({ user, priceId, successUrl, cancelUrl }) {
  const s = getStripe();
  if (!s) throw new Error("Billing is not configured");
  const customer = await ensureCustomer(user);

  return s.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    client_reference_id: String(user._id),
    subscription_data: { metadata: { userId: String(user._id) } },
  });
}

export async function createPortalSession({ user, returnUrl }) {
  const s = getStripe();
  if (!s) throw new Error("Billing is not configured");
  if (!user.stripeCustomerId) throw new Error("No billing account yet");
  return s.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: returnUrl,
  });
}

export async function cancelSubscriptionForUser(user) {
  const s = getStripe();
  if (!s || !user.stripeSubscriptionId) return;
  await s.subscriptions
    .cancel(user.stripeSubscriptionId)
    .catch(() => {}); /* already gone is fine */
}

/**
 * Apply a Stripe subscription object to our User record.
 * Called from the webhook for created/updated/deleted events.
 */
export async function syncSubscription(subscription) {
  const customerId = subscription.customer;
  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) return;

  const status = subscription.status;
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const planId = planForPrice(priceId) || "free";

  const activeish = ["active", "trialing", "past_due"].includes(status);

  user.plan = activeish ? planId : "free";
  user.subscriptionStatus = status;
  user.stripeSubscriptionId =
    status === "canceled" ? null : subscription.id;
  user.planRenewsAt = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null;
  await user.save();
}

export function planLimits(planId) {
  return (PLANS[planId] || PLANS.free).limits;
}
