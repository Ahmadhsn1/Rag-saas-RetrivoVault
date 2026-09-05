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
import { env, isProd, isTestEnv } from "../config/env.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../middleware/auth.js";
import { issueToken, consumeToken } from "../services/authTokens.js";
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
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
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
  const { name, email, password } = req.body || {};
  if (!name || !emailRe.test(email || "") || !password || password.length < 8) {
    throw ApiError.badRequest(
      "name, valid email, and password (min 8 chars) are required"
    );
  }

  const exists = await User.findOne({ email: email.toLowerCase() }).lean();
  if (exists) throw ApiError.conflict("Email already registered");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    passwordHash,
    emailVerified: env.demoMode || isTestEnv,
  });

  if (!user.emailVerified) {
    await sendVerificationEmail(user).catch((err) =>
      console.error("[auth] verification email failed:", err.message)
    );
  }

  const accessToken = signAccessToken(user._id);
  setRefreshCookie(res, signRefreshToken(user._id));

  res.status(201).json({ user: user.toJSON(), accessToken });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw ApiError.badRequest("email and password required");

  const user = await User.findOne({ email: email.toLowerCase() });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw ApiError.unauthorized("Invalid credentials");

  const accessToken = signAccessToken(user._id);
  setRefreshCookie(res, signRefreshToken(user._id));

  res.json({ user: user.toJSON(), accessToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized("Missing refresh token");

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid refresh token");
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized("User no longer exists");

  const accessToken = signAccessToken(user._id);
  setRefreshCookie(res, signRefreshToken(user._id));

  res.json({ user: user.toJSON(), accessToken });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  res.status(204).end();
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.unauthorized();
  res.json({ user: user.toJSON() });
});

// --- Email verification ---

export const verifyEmail = asyncHandler(async (req, res) => {
  const raw = req.body?.token || req.query?.token;
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
  const email = (req.body?.email || "").toLowerCase().trim();
  const user = email ? await User.findOne({ email }) : null;

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
  const { token, password } = req.body || {};
  if (!password || password.length < 8) {
    throw ApiError.badRequest("Password must be at least 8 characters");
  }
  const userId = await consumeToken(token, "password_reset");
  if (!userId) throw ApiError.badRequest("Invalid or expired reset link");

  const passwordHash = await bcrypt.hash(password, 12);
  await User.findByIdAndUpdate(userId, { passwordHash });
  res.json({ ok: true });
});

// --- Account deletion (cascade) ---

export const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body || {};
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
  ]);
  await User.deleteOne({ _id: uid });

  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  res.status(204).end();
});
