import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { enforceCollectionQuota } from "../middleware/quota.js";
import {
  createCollection,
  listCollections,
  updateCollection,
  deleteCollection,
} from "../controllers/collectionController.js";

const router = Router();

router.use(requireAuth);

router.post("/", enforceCollectionQuota, createCollection);
router.get("/", listCollections);
router.patch("/:id", updateCollection);
router.delete("/:id", deleteCollection);

export default router;
