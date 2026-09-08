import { Router } from "express";
import { getSharedSession } from "../controllers/chatController.js";
import { openApiSpec } from "../config/openapi.js";

const router = Router();

// Unauthenticated, read-only shared chat.
router.get("/shared-chats/:shareId", getSharedSession);

// Machine-readable API description.
router.get("/openapi.json", (_req, res) => res.json(openApiSpec));

export default router;
