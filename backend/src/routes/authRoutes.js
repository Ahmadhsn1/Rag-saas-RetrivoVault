import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter, refreshLimiter } from "../middleware/rateLimiter.js";
import {
  signup,
  login,
  refresh,
  logout,
  logoutAll,
  me,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  deleteAccount,
} from "../controllers/authController.js";

const router = Router();

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/refresh", refreshLimiter, refresh);
router.post("/logout", logout);
router.post("/logout-all", requireAuth, logoutAll);
router.get("/me", requireAuth, me);

router.post("/verify-email", verifyEmail);
router.post("/resend-verification", requireAuth, authLimiter, resendVerification);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

router.delete("/account", requireAuth, deleteAccount);

export default router;
