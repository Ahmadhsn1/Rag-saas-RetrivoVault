import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { chatLimiter } from "../middleware/rateLimiter.js";
import {
  createSession,
  listSessions,
  getSession,
  deleteSession,
  sendMessage,
} from "../controllers/chatController.js";

const router = Router();

router.use(requireAuth);

router.post("/", createSession);
router.get("/", listSessions);
router.get("/:sessionId", getSession);
router.delete("/:sessionId", deleteSession);
router.post("/:sessionId/message", chatLimiter, sendMessage);

export default router;
