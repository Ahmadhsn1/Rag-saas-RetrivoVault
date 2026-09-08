import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Document } from "../models/Document.js";
import { Chunk } from "../models/Chunk.js";
import { Collection } from "../models/Collection.js";
import { ChatSession } from "../models/ChatSession.js";
import { ApiKey } from "../models/ApiKey.js";
import { Token } from "../models/Token.js";
import { UsageEvent } from "../models/UsageEvent.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { Notification } from "../models/Notification.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { Webhook } from "../models/Webhook.js";
import { env, isProd, isTestEnv } from "../config/env.js";
import ms from "../utils/ms.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import { str } from "../middleware/sanitize.js";
import { signAccessToken } from "../middleware/auth.js";
import { issueToken, consumeToken } from "../services/authTokens.js";
import { TRIAL_DAYS, TRIAL_PLAN } from "../config/plans.js";
import { logActivity } from "../services/activityLog.js";
import { notify } from "../services/notifications.js";
import {
  startSession,
  rotate,
  revokeByToken,
  revokeAllForUser,
} from "../services/refreshTokens.js";
import {
  sendMail,
  verifyEmailTemplate,
  resetPasswordTemplate,
} from "../services/mailer.js";
import { cancelSubscriptionForUser } from "../services/billing.js";

const REFRESH_COOKIE = "rv_refresh";

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/api/auth",
    maxAge: ms(env.jwt.refreshTtl),
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sendVerificationEmail(user) {
  const raw = await issueToken(user._id, "email_verify");
  const url = `${env.appUrl}/verify-email?token=${raw}`;
  const tpl = verifyEmailTemplate({ name: user.name, url });
  await sendMail({ to: user.email, ...tpl });
  return url;
}

export const signup = asyncHandler(async (req, res) => {
  const name = str(req.body?.name).trim().slice(0, 120);
  const email = str(req.body?.email).trim().toLowerCase().slice(0, 254);
  const password = str(req.body?.password);
  if (!name || !emailRe.test(email) || password.length < 8 || password.length > 200) {
    throw ApiError.badRequest(
      "name, valid email, and password (8–200 chars) are required"
    );
  }

  const exists = await User.findOne({ email }).lean();
  if (exists) throw ApiError.conflict("Email already registered");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    passwordHash,
    emailVerified: env.demoMode || isTestEnv,
    trialPlan: TRIAL_PLAN,
    trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
  });

  if (!user.emailVerified) {
    await sendVerificationEmail(user).catch((err) =>
      console.error("[auth] verification email failed:", err.message)
    );
  }

  logActivity(user._id, "auth.signup", email, req);
  void notify(user._id, {
    type: "welcome",
    title: `Welcome to Retrivo Vault, ${name.split(" ")[0] || "there"}`,
    body: `Your ${TRIAL_DAYS}-day ${TRIAL_PLAN.toUpperCase()} trial is active. Upload a document to get started.`,
    link: "/app/documents",
  });

  const accessToken = signAccessToken(user._id);
  const { raw } = await startSession(user._id, req);
  setRefreshCookie(res, raw);

  res.status(201).json({ user: user.toJSON(), accessToken });
});

const MAX_FAILED = 8;
const LOCK_MS = 15 * 60 * 1000;

export const login = asyncHandler(async (req, res) => {
  const email = str(req.body?.email).trim().toLowerCase().slice(0, 254);
  const password = str(req.body?.password);
  if (!email || !password) throw ApiError.badRequest("email and password required");

  const user = await User.findOne({ email });

  if (user?.isLocked()) {
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw new ApiError(
      429,
      `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`
    );
  }

  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) {
    if (user) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= MAX_FAILED) {
        user.lockedUntil = new Date(Date.now() + LOCK_MS);
        user.failedLoginAttempts = 0;
      }
      await user.save();
    }
    throw ApiError.unauthorized("Invalid credentials");
  }

  if (user.failedLoginAttempts || user.lockedUntil) {
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();
  }

  const accessToken = signAccessToken(user._id);
  const { raw } = await startSession(user._id, req);
  setRefreshCookie(res, raw);
  logActivity(user._id, "auth.login", null, req);

  res.json({ user: user.toJSON(), accessToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];

  let rotated;
  try {
    rotated = await rotate(token, req);
  } catch (err) {
    clearRefreshCookie(res);
    if (err.code === "reuse") {
      throw ApiError.unauthorized("Session invalidated — please sign in again");
    }
    throw ApiError.unauthorized("Session expired");
  }

  const user = await User.findById(rotated.userId);
  if (!user) {
    clearRefreshCookie(res);
    throw ApiError.unauthorized("User no longer exists");
  }

  setRefreshCookie(res, rotated.raw);
  res.json({ user: user.toJSON(), accessToken: signAccessToken(user._id) });
});

export const logout = asyncHandler(async (req, res) => {
  await revokeByToken(req.cookies?.[REFRESH_COOKIE]).catch(() => {});
  clearRefreshCookie(res);
  res.status(204).end();
});

export const logoutAll = asyncHandler(async (req, res) => {
  await revokeAllForUser(req.user.id);
  clearRefreshCookie(res);
  res.status(204).end();
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.unauthorized();
  res.json({ user: user.toJSON() });
});

// --- Email verification ---

export const verifyEmail = asyncHandler(async (req, res) => {
  const raw = str(req.body?.token) || str(req.query?.token);
  const userId = await consumeToken(raw, "email_verify");
  if (!userId) throw ApiError.badRequest("Invalid or expired verification link");

  await User.findByIdAndUpdate(userId, { emailVerified: true });
  const user = await User.findById(userId);
  res.json({ user: user.toJSON() });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.unauthorized();
  if (user.emailVerified) return res.json({ alreadyVerified: true });

  await sendVerificationEmail(user);
  res.json({ sent: true });
});

// --- Password reset ---

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = str(req.body?.email).toLowerCase().trim().slice(0, 254);
  const user = email && emailRe.test(email) ? await User.findOne({ email }) : null;

  // Always 200 — don't reveal whether the address exists.
  if (user) {
    const raw = await issueToken(user._id, "password_reset");
    const url = `${env.appUrl}/reset-password?token=${raw}`;
    const tpl = resetPasswordTemplate({ name: user.name, url });
    await sendMail({ to: user.email, ...tpl }).catch((err) =>
      console.error("[auth] reset email failed:", err.message)
    );
  }
  res.json({ ok: true });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const token = str(req.body?.token);
  const password = str(req.body?.password);
  if (password.length < 8 || password.length > 200) {
    throw ApiError.badRequest("Password must be 8–200 characters");
  }
  const userId = await consumeToken(token, "password_reset");
  if (!userId) throw ApiError.badRequest("Invalid or expired reset link");

  const passwordHash = await bcrypt.hash(password, 12);
  await User.findByIdAndUpdate(userId, {
    passwordHash,
    failedLoginAttempts: 0,
    lockedUntil: null,
  });
  // A password reset invalidates every existing session.
  await revokeAllForUser(userId);
  res.json({ ok: true });
});

// --- Account deletion (cascade) ---

export const deleteAccount = asyncHandler(async (req, res) => {
  const password = str(req.body?.password);
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.unauthorized();

  const ok = password && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw ApiError.unauthorized("Password is incorrect");

  await cancelSubscriptionForUser(user).catch((err) =>
    console.error("[auth] stripe cancel on delete failed:", err.message)
  );

  const uid = new mongoose.Types.ObjectId(req.user.id);
  await Promise.all([
    Chunk.deleteMany({ userId: uid }),
    Document.deleteMany({ userId: uid }),
    Collection.deleteMany({ userId: uid }),
    ChatSession.deleteMany({ userId: uid }),
    ApiKey.deleteMany({ userId: uid }),
    Token.deleteMany({ userId: uid }),
    UsageEvent.deleteMany({ userId: uid }),
    RefreshToken.deleteMany({ userId: uid }),
    Notification.deleteMany({ userId: uid }),
    ActivityLog.deleteMany({ userId: uid }),
    Webhook.deleteMany({ userId: uid }),
  ]);
  await User.deleteOne({ _id: uid });

  clearRefreshCookie(res);
  res.status(204).end();
});
