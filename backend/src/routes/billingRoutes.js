import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getBilling,
  startCheckout,
  openPortal,
} from "../controllers/billingController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getBilling);
router.post("/checkout", startCheckout);
router.post("/portal", openPortal);

export default router;
