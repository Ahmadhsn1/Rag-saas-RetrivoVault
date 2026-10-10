import { Router } from "express";
import { getSharedSession } from "../controllers/chatController.js";
import { openApiSpec } from "../config/openapi.js";
import { env } from "../config/env.js";

const router = Router();

// Unauthenticated, read-only shared chat.
router.get("/shared-chats/:shareId", getSharedSession);

// What the sign-in pages need to know before anyone is logged in.
router.get("/config", (_req, res) =>
  res.json({ googleClientId: env.google.clientId ?? null })
);

// Machine-readable API description.
router.get("/openapi.json", (_req, res) => res.json(openApiSpec));

export default router;
