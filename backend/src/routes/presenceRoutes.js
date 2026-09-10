import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { ping } from "../controllers/presenceController.js";

const router = Router();

router.use(requireAuth);
router.post("/ping", ping);

export default router;
