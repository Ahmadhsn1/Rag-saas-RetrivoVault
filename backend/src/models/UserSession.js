import mongoose from "mongoose";

/**
 * A durable record of one sign-in session (one device / browser).
 *
 * Distinct from `RefreshToken` — that collection is about token rotation and is
 * purged aggressively. This one is the audit/presence trail the admin console
 * and the user's "active devices" list read from. Linked to a refresh-token
 * `family` so rotation and logout can keep it in sync.
 *
 *   startedAt  — first issued (login / signup)
 *   lastSeenAt — bumped by the client heartbeat and by token refresh
 *   endedAt    — set on logout / revoke / expiry sweep (null = still open)
 *   online is derived, not stored: endedAt == null && lastSeenAt within window
 */
const userSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // refresh-token family this session belongs to (one per device)
    family: { type: String, required: true, index: true },

    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    // best-effort parse of userAgent — "Chrome on macOS", "Safari on iOS", …
    device: { type: String, default: null },

    startedAt: { type: Date, default: () => new Date() },
    lastSeenAt: { type: Date, default: () => new Date() },
    endedAt: { type: Date, default: null },
    endReason: {
      type: String,
      enum: [null, "logout", "logout_all", "expired", "revoked", "admin", "password_reset"],
      default: null,
    },
  },
  { timestamps: { createdAt: false, updatedAt: false } }
);

// presence queries: "open sessions seen since <cutoff>"
userSessionSchema.index({ endedAt: 1, lastSeenAt: -1 });
userSessionSchema.index({ userId: 1, startedAt: -1 });
// keep 120 days of history, then let Mongo reap it
userSessionSchema.index(
  { startedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 120 }
);

userSessionSchema.methods.durationMs = function () {
  return (this.endedAt ?? this.lastSeenAt).getTime() - this.startedAt.getTime();
};

export const UserSession = mongoose.model("UserSession", userSessionSchema);

/** Tiny dependency-free userAgent → "Browser on OS" summariser. */
export function describeDevice(ua) {
  if (typeof ua !== "string" || !ua) return null;
  const browser =
    /Edg\//.test(ua) ? "Edge" :
    /OPR\//.test(ua) ? "Opera" :
    /Firefox\//.test(ua) ? "Firefox" :
    /Chrome\//.test(ua) && !/Chromium/.test(ua) ? "Chrome" :
    /Chromium\//.test(ua) ? "Chromium" :
    /Version\/.*Safari/.test(ua) ? "Safari" :
    /curl\//i.test(ua) ? "curl" :
    /PostmanRuntime/i.test(ua) ? "Postman" :
    "Unknown browser";
  const os =
    /Windows NT 10/.test(ua) ? "Windows" :
    /Windows/.test(ua) ? "Windows" :
    /iPhone|iPad|iPod/.test(ua) ? "iOS" :
    /Mac OS X|Macintosh/.test(ua) ? "macOS" :
    /Android/.test(ua) ? "Android" :
    /Linux/.test(ua) ? "Linux" :
    "unknown OS";
  return `${browser} on ${os}`;
}
