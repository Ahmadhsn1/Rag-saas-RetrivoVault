import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import {
  adminStats,
  adminListUsers,
  adminGetUser,
  adminUpdateUser,
} from "../controllers/adminController.js";

const router = Router();

router.use(requireAuth, requireAdmin);
router.get("/stats", adminStats);
router.get("/users", adminListUsers);
router.get("/users/:id", adminGetUser);
router.patch("/users/:id", adminUpdateUser);

export default router;
