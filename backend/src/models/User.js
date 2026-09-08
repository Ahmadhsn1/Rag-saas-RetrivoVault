import mongoose from "mongoose";

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

// The plan actually in force right now (paid subscription > live trial > free).
userSchema.methods.effectivePlan = function () {
  if (this.plan !== "free") return this.plan;
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
    __v,
    ...rest
  } = this.toObject();
  void geminiApiKey;
  void failedLoginAttempts;
  void lockedUntil;
  return rest;
};

export const User = mongoose.model("User", userSchema);
