import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiKey, hashApiKey } from "../models/ApiKey.js";

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
    // `fam` ties the request to a UserSession (device). Optional — tokens issued
    // before this change simply won't carry it.
    req.user = { id: payload.sub, family: payload.fam ?? null };
    req.authMethod = "jwt";
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired access token"));
  }
}

// Accepts either a Bearer JWT or an `x-api-key` personal API key.
// Used on programmatic endpoints (chat, documents).
export async function authenticateFlexible(req, _res, next) {
  const apiKey = req.headers["x-api-key"];
  if (apiKey) {
    try {
      const doc = await ApiKey.findOne({
        keyHash: hashApiKey(String(apiKey)),
        revokedAt: null,
      });
      if (!doc) return next(ApiError.unauthorized("Invalid API key"));
      doc.lastUsedAt = new Date();
      await doc.save();
      req.user = { id: String(doc.userId), family: null };
      req.authMethod = "apikey";
      return next();
    } catch (err) {
      return next(err);
    }
  }
  return requireAuth(req, _res, next);
}

export function signAccessToken(userId, family = null) {
  const payload = { sub: String(userId) };
  if (family) payload.fam = String(family);
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessTtl,
  });
}
