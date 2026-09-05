import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getUsage, getUsageChart } from "../controllers/usageController.js";

const router = Router();

router.use(requireAuth);
router.get("/", getUsage);
router.get("/chart", getUsageChart);

export default router;
