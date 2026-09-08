import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
} from "../controllers/webhookController.js";

const router = Router();

router.use(requireAuth);
router.get("/", listWebhooks);
router.post("/", createWebhook);
router.patch("/:id", updateWebhook);
router.delete("/:id", deleteWebhook);

export default router;
