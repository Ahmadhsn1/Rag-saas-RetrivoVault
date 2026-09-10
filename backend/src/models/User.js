import mongoose from "mongoose";
import { planFor } from "../config/plans.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },

    emailVerified: { type: Boolean, default: false },

    role: { type: String, enum: ["user", "admin"], default: "user" },
    // Provisioned from ADMIN_EMAIL / ADMIN_PASSWORD at boot. Protected: cannot be
    // suspended, demoted, or deleted through the admin API.
    isRootAdmin: { type: Boolean, default: false },
    adminSince: { type: Date, default: null },

    // Forced on by an admin-issued temporary password; the app blocks everything
    // but the change-password screen until the user picks a new one.
    mustChangePassword: { type: Boolean, default: false },

    // --- Admin: suspension (login + token refresh refused; sessions revoked) ---
    suspendedAt: { type: Date, default: null },
    suspendedReason: { type: String, default: null },
    suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // --- Admin: complimentary plan access ---
    // Grants an effective plan without a Stripe subscription. `expiresAt: null`
    // means it never lapses. Checked live by effectivePlan().
    comp: {
      plan: { type: String, enum: ["pro", "max", null], default: null },
      expiresAt: { type: Date, default: null },
      reason: { type: String, default: null },
      grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      grantedAt: { type: Date, default: null },
    },

    // --- Billing / plan ---
    plan: {
      type: String,
      enum: ["free", "pro", "max"],
      default: "free",
      index: true,
    },
    // A signup grants a time-limited Pro trial; when it lapses the effective
    // plan falls back to `plan` (see getEffectivePlan / plans.js).
    trialPlan: { type: String, enum: ["pro", "max", null], default: null },
    trialEndsAt: { type: Date, default: null },

    notificationPrefs: {
      ingestComplete: { type: Boolean, default: true },
      quotaWarnings: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false },
      productUpdates: { type: Boolean, default: true },
    },
    subscriptionStatus: {
      type: String,
      enum: [
        "none",
        "active",
        "trialing",
        "past_due",
        "canceled",
        "incomplete",
        "unpaid",
      ],
      default: "none",
    },
    planRenewsAt: { type: Date, default: null },
    stripeCustomerId: { type: String, default: null, index: true },
    stripeSubscriptionId: { type: String, default: null },

    // Bring-your-own Gemini key (paid plans). Stored as-is; treat as a secret.
    // Never selected by default; load explicitly with .select("+geminiApiKey").
    geminiApiKey: { type: String, default: null, select: false },
    hasGeminiKey: { type: Boolean, default: false },

    // --- Usage counters (rolling monthly window) ---
    usage: {
      queriesThisPeriod: { type: Number, default: 0 },
      periodStart: { type: Date, default: () => new Date() },
    },

    // --- Brute-force protection ---
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

userSchema.methods.isLocked = function () {
  return this.lockedUntil && this.lockedUntil.getTime() > Date.now();
};

userSchema.methods.isSuspended = function () {
  return Boolean(this.suspendedAt);
};

/** A live admin comp grant, or null if none / lapsed. */
userSchema.methods.activeComp = function () {
  const c = this.comp;
  if (!c || !c.plan) return null;
  if (c.expiresAt && c.expiresAt.getTime() <= Date.now()) return null;
  return c;
};

// The plan actually in force right now:
//   paid subscription > active admin comp > live signup trial > free
userSchema.methods.effectivePlan = function () {
  if (this.plan !== "free") return this.plan;
  const comp = this.activeComp();
  if (comp) return comp.plan;
  if (this.trialPlan && this.trialEndsAt && this.trialEndsAt.getTime() > Date.now()) {
    return this.trialPlan;
  }
  return "free";
};

userSchema.methods.toJSON = function () {
  const {
    passwordHash,
    geminiApiKey,
    failedLoginAttempts,
    lockedUntil,
    suspendedReason,
    suspendedBy,
    __v,
    ...rest
  } = this.toObject();
  void geminiApiKey;
  void failedLoginAttempts;
  void lockedUntil;
  void suspendedReason;
  void suspendedBy;
  // strip who granted the comp, keep the grant itself (users may see their perk)
  if (rest.comp) {
    const { grantedBy, ...comp } = rest.comp;
    void grantedBy;
    rest.comp = comp;
  }

  // Resolved plan + entitlements, so the client never has to re-derive
  // "is this feature unlocked?" from raw plan/trial/comp fields.
  const plan = planFor(this);
  rest.effectivePlan = this.effectivePlan();
  rest.features = { ...plan.features };
  rest.planLimits = { ...plan.limits };

  return rest;
};

export const User = mongoose.model("User", userSchema);
