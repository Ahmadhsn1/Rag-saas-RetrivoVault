import rateLimit from "express-rate-limit";
import { isTestEnv } from "../config/env.js";

const keyByUser = (req) => req.user?.id || req.ip;

// Rate limiting is a no-op under test (deterministic, fast suites).
const make = (opts) =>
  rateLimit({
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: () => isTestEnv,
    ...opts,
  });

// Protects the Gemini free-tier quota from a single user hammering chat.
export const chatLimiter = make({
  windowMs: 60 * 1000,
  limit: 15,
  keyGenerator: keyByUser,
  message: { error: "Too many chat requests, slow down." },
});

// Ingestion is expensive (parsing + embedding). Keep it modest.
export const uploadLimiter = make({
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: keyByUser,
  message: { error: "Too many uploads, slow down." },
});

// Login / signup / reset — a backstop against credential stuffing from one IP.
// (Per-account lockout after 8 failures is the primary brute-force defense.)
export const authLimiter = make({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  message: { error: "Too many attempts, try again later." },
});

// Token refresh — same IP, but every tab/reload hits it, so be generous.
export const refreshLimiter = make({
  windowMs: 5 * 60 * 1000,
  limit: 60,
  message: { error: "Too many refresh attempts." },
});
