import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  updateProfile,
  updateNotificationPrefs,
  setGeminiKey,
  clearGeminiKey,
  getActivity,
  getSessions,
  revokeSession,
  exportData,
} from "../controllers/accountController.js";

const router = Router();

router.use(requireAuth);
router.patch("/profile", updateProfile);
router.patch("/notification-prefs", updateNotificationPrefs);
router.put("/gemini-key", setGeminiKey);
router.delete("/gemini-key", clearGeminiKey);
router.get("/activity", getActivity);
router.get("/sessions", getSessions);
router.delete("/sessions/:family", revokeSession);
router.get("/export", exportData);

export default router;
