import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  updateProfile,
  setGeminiKey,
  clearGeminiKey,
} from "../controllers/accountController.js";

const router = Router();

router.use(requireAuth);
router.patch("/profile", updateProfile);
router.put("/gemini-key", setGeminiKey);
router.delete("/gemini-key", clearGeminiKey);

export default router;
