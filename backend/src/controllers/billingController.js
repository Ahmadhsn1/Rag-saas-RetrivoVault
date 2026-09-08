import { User } from "../models/User.js";
import { env, billingEnabled } from "../config/env.js";
import { PLANS, planFor, priceIsKnown } from "../config/plans.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import {
  getStripe,
  createCheckoutSession,
  createPortalSession,
  syncSubscription,
} from "../services/billing.js";

export const getBilling = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.unauthorized();
  const plan = planFor(user);
  const onTrial =
    user.plan === "free" &&
    user.trialEndsAt &&
    user.trialEndsAt.getTime() > Date.now();

  res.json({
    billingEnabled,
    plan: {
      id: plan.id,
      name: plan.name,
      limits: plan.limits,
      features: plan.features,
    },
    trial: onTrial
      ? { plan: user.trialPlan, endsAt: user.trialEndsAt }
      : null,
    subscriptionStatus: user.subscriptionStatus,
    planRenewsAt: user.planRenewsAt,
    hasBillingAccount: Boolean(user.stripeCustomerId),
    catalog: Object.values(PLANS).map((p) => ({
      id: p.id,
      name: p.name,
      limits: p.limits,
      prices: p.prices ?? null,
    })),
  });
});

export const startCheckout = asyncHandler(async (req, res) => {
  if (!billingEnabled) throw ApiError.badRequest("Billing is not configured");
  const { priceId } = req.body || {};
  if (!priceId || !priceIsKnown(priceId)) {
    throw ApiError.badRequest("Unknown price");
  }

  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.unauthorized();

  const session = await createCheckoutSession({
    user,
    priceId,
    successUrl: `${env.appUrl}/app/settings?tab=billing&checkout=success`,
    cancelUrl: `${env.appUrl}/app/settings?tab=billing&checkout=cancel`,
  });
  res.json({ url: session.url });
});

export const openPortal = asyncHandler(async (req, res) => {
  if (!billingEnabled) throw ApiError.badRequest("Billing is not configured");
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.unauthorized();
  if (!user.stripeCustomerId) {
    throw ApiError.badRequest("No billing account yet — upgrade first");
  }

  const session = await createPortalSession({
    user,
    returnUrl: `${env.appUrl}/app/settings?tab=billing`,
  });
  res.json({ url: session.url });
});

// Stripe webhook — mounted with express.raw() before json parsing.
export const handleWebhook = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(400).send("billing disabled");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      env.stripe.webhookSecret
    );
  } catch (err) {
    return res.status(400).send(`Webhook signature error: ${err.message}`);
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object);
      break;
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        await syncSubscription(sub);
      }
      break;
    }
    default:
      break;
  }

  res.json({ received: true });
});
