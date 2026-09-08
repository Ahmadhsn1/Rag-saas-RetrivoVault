import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getNotifications,
  readNotifications,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = Router();

router.use(requireAuth);
router.get("/", getNotifications);
router.post("/read", readNotifications);
router.delete("/:id", deleteNotification);

export default router;
