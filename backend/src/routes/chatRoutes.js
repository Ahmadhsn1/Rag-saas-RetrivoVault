import { Router } from "express";
import { authenticateFlexible } from "../middleware/auth.js";
import { chatLimiter } from "../middleware/rateLimiter.js";
import { enforceQueryQuota } from "../middleware/quota.js";
import {
  createSession,
  listSessions,
  getSession,
  renameSession,
  deleteSession,
  sendMessage,
} from "../controllers/chatController.js";

const router = Router();

router.use(authenticateFlexible);

router.post("/", createSession);
router.get("/", listSessions);
router.get("/:sessionId", getSession);
router.patch("/:sessionId", renameSession);
router.delete("/:sessionId", deleteSession);
router.post("/:sessionId/message", chatLimiter, enforceQueryQuota, sendMessage);

export default router;
