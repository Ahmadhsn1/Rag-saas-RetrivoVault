import rateLimit from "express-rate-limit";

const keyByUser = (req) => req.user?.id || req.ip;

// Protects the Gemini free-tier quota from a single user hammering chat.
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: keyByUser,
  message: { error: "Too many chat requests, slow down." },
});

// Ingestion is expensive (parsing + embedding). Keep it modest.
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: keyByUser,
  message: { error: "Too many uploads, slow down." },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many auth attempts, try again later." },
});
