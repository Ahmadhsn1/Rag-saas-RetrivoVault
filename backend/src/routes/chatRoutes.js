import { Router } from "express";
import { authenticateFlexible } from "../middleware/auth.js";
import { chatLimiter } from "../middleware/rateLimiter.js";
import { enforceQueryQuota } from "../middleware/quota.js";
import {
  createSession,
  listSessions,
  getSession,
  updateSession,
  deleteSession,
  shareSession,
  messageFeedback,
  sendMessage,
} from "../controllers/chatController.js";

const router = Router();

router.use(authenticateFlexible);

router.post("/", createSession);
router.get("/", listSessions);
router.get("/:sessionId", getSession);
router.patch("/:sessionId", updateSession);
router.delete("/:sessionId", deleteSession);
router.post("/:sessionId/share", shareSession);
router.post("/:sessionId/messages/:messageId/feedback", messageFeedback);
router.post("/:sessionId/message", chatLimiter, enforceQueryQuota, sendMessage);

export default router;
