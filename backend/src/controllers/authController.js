import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { env, isProd } from "../config/env.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../middleware/auth.js";

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
  const user = await User.create({ name, email, passwordHash });

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
