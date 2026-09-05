import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimiter.js";
import { uploadSingle } from "../middleware/upload.js";
import {
  uploadDocument,
  listDocuments,
  getDocument,
  deleteDocument,
} from "../controllers/documentController.js";

const router = Router();

router.use(requireAuth);

router.post("/", uploadLimiter, uploadSingle, uploadDocument);
router.get("/", listDocuments);
router.get("/:id", getDocument);
router.delete("/:id", deleteDocument);

export default router;
