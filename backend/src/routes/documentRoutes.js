import { Router } from "express";
import { authenticateFlexible } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimiter.js";
import { uploadSingle } from "../middleware/upload.js";
import { enforceDocumentQuota } from "../middleware/quota.js";
import {
  uploadDocument,
  ingestUrl,
  retryDocument,
  listDocuments,
  getDocument,
  deleteDocument,
} from "../controllers/documentController.js";

const router = Router();

router.use(authenticateFlexible);

router.post("/", uploadLimiter, uploadSingle, enforceDocumentQuota, uploadDocument);
router.post("/url", uploadLimiter, enforceDocumentQuota, ingestUrl);
router.post("/:id/retry", uploadLimiter, retryDocument);
router.get("/", listDocuments);
router.get("/:id", getDocument);
router.delete("/:id", deleteDocument);

export default router;
