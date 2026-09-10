import mongoose from "mongoose";

/**
 * Append-only record of every privileged action taken through /api/admin/*.
 * Separate from the per-user `ActivityLog` — this is the operator's trail:
 * who did what, to whom, from where. Never updated, never deleted by the app.
 */
const adminAuditSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    adminEmail: { type: String, default: null },
    action: { type: String, required: true }, // "user.grant", "user.suspend", "broadcast.send", …
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    targetEmail: { type: String, default: null },
    // small structured context — never secrets
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

adminAuditSchema.index({ createdAt: -1 });
// retain a full year of operator history
adminAuditSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 365 }
);

export const AdminAudit = mongoose.model("AdminAudit", adminAuditSchema);
