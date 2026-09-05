import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

// Verifies the access token (Authorization: Bearer <token>) and attaches
// req.user = { id }. Every downstream query scopes by req.user.id.
export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(ApiError.unauthorized("Missing access token"));
  }

  try {
    const payload = jwt.verify(token, env.jwt.accessSecret);
    req.user = { id: payload.sub };
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired access token"));
  }
}

export function signAccessToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessTtl,
  });
}

export function signRefreshToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshTtl,
  });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}
