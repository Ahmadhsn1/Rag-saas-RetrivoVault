/**
 * Provision or rotate the root administrator account.
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-strong-passphrase' \
 *     npm run seed:admin
 *
 * - Creates the account if it doesn't exist (role=admin, isRootAdmin).
 * - If it exists, RESETS its password to ADMIN_PASSWORD and ensures the admin
 *   flags — use this to rotate a forgotten operator password.
 * - Also prints a fresh VAPID key pair if VAPID keys aren't set yet, so you can
 *   paste them into your env to enable Web Push.
 *
 * Nothing here is committed to the repo. Run it once per deployment.
 */
import bcrypt from "bcryptjs";
import { env, pushEnabled } from "../config/env.js";
import { connectDB, disconnectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { generateVapidKeys } from "../services/pushService.js";

async function main() {
  const email = env.admin.email;
  const password = env.admin.password;
  if (!email || !password) {
    console.error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD, e.g.\n" +
        "  ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='strong passphrase' npm run seed:admin"
    );
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("ADMIN_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }

  env.mongoUri ||= "mongodb://127.0.0.1:27017/retrivo_vault";
  await connectDB();

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.passwordHash = passwordHash;
    existing.role = "admin";
    existing.isRootAdmin = true;
    existing.adminSince ||= new Date();
    existing.emailVerified = true;
    existing.mustChangePassword = false;
    existing.suspendedAt = null;
    existing.suspendedReason = null;
    existing.failedLoginAttempts = 0;
    existing.lockedUntil = null;
    await existing.save();
    console.log(`✓ Root admin password rotated for ${email}`);
  } else {
    await User.create({
      name: env.admin.name,
      email,
      passwordHash,
      emailVerified: true,
      role: "admin",
      isRootAdmin: true,
      adminSince: new Date(),
      trialPlan: null,
      trialEndsAt: null,
    });
    console.log(`✓ Root admin created: ${email}`);
  }

  if (!pushEnabled) {
    const keys = generateVapidKeys();
    console.log(
      "\nWeb Push is not configured. To enable broadcast push notifications, add:\n" +
        `  VAPID_PUBLIC_KEY=${keys.publicKey}\n` +
        `  VAPID_PRIVATE_KEY=${keys.privateKey}\n` +
        "  VAPID_SUBJECT=mailto:you@example.com\n"
    );
  }

  await disconnectDB();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
