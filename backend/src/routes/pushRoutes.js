import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getPushConfig,
  subscribePush,
  unsubscribePush,
} from "../controllers/pushController.js";

const router = Router();

router.get("/config", getPushConfig); // public — no secrets, just the VAPID public key
router.post("/subscribe", requireAuth, subscribePush);
router.post("/unsubscribe", requireAuth, unsubscribePush);

export default router;
