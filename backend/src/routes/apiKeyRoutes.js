import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listApiKeys,
  createApiKey,
  revokeApiKey,
} from "../controllers/apiKeyController.js";

const router = Router();

router.use(requireAuth);
router.get("/", listApiKeys);
router.post("/", createApiKey);
router.delete("/:id", revokeApiKey);

export default router;
