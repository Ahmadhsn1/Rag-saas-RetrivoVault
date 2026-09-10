import bcrypt from "bcryptjs";
import { env, isProd } from "../config/env.js";
import { logger } from "../config/logger.js";
import { User } from "../models/User.js";

const PLACEHOLDERS = new Set([
  "changeme",
  "change_me",
  "admin",
  "password",
  "replace_with_a_strong_password",
]);

/**
 * Provision the single root admin from ADMIN_EMAIL / ADMIN_PASSWORD.
 *
 * Runs once at boot. Idempotent:
 *   - no such user  -> create it (role=admin, isRootAdmin, emailVerified)
 *   - user exists   -> ensure role=admin + isRootAdmin; never touches the
 *                      password (rotate it with `npm run seed:admin`)
 *
 * Nothing is committed to the repo — every deployment sets its own env. The
 * password is used here and then dropped; it is never logged.
 */
export async function bootstrapAdmin() {
  const email = env.admin.email;
  const password = env.admin.password;

  if (!email && !password) {
    logger.info(
      "no ADMIN_EMAIL / ADMIN_PASSWORD set — skipping root-admin provisioning " +
        "(set them, or use ADMIN_EMAILS to promote an existing account)"
    );
    return null;
  }
  if (!email || !password) {
    logger.warn(
      "ADMIN_EMAIL and ADMIN_PASSWORD must both be set to provision the root admin — skipping"
    );
    return null;
  }

  const weak =
    password.length < 12 || PLACEHOLDERS.has(password.trim().toLowerCase());
  if (weak) {
    const msg =
      "ADMIN_PASSWORD is too weak (need 12+ chars, not a common placeholder)";
    if (isProd) throw new Error(msg);
    logger.warn(`${msg} — provisioning anyway (dev)`);
  }

  const existing = await User.findOne({ email });

  if (existing) {
    const patch = {};
    if (existing.role !== "admin") patch.role = "admin";
    if (!existing.isRootAdmin) patch.isRootAdmin = true;
    if (!existing.adminSince) patch.adminSince = new Date();
    if (Object.keys(patch).length) {
      await User.updateOne({ _id: existing._id }, patch);
      logger.info({ email }, "root admin: promoted existing account");
    } else {
      logger.info({ email }, "root admin: already provisioned");
    }
    return existing._id;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await User.create({
    name: env.admin.name,
    email,
    passwordHash,
    emailVerified: true,
    role: "admin",
    isRootAdmin: true,
    adminSince: new Date(),
    // no signup trial for the operator account
    trialPlan: null,
    trialEndsAt: null,
  });
  logger.info({ email }, "root admin: account created");
  return admin._id;
}
