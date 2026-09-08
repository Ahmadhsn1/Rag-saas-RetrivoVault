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

    // --- Billing / plan ---
    plan: {
      type: String,
      enum: ["free", "pro", "max"],
      default: "free",
      index: true,
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
