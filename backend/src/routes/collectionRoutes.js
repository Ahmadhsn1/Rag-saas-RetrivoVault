import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { enforceCollectionQuota } from "../middleware/quota.js";
import {
  createCollection,
  listCollections,
  renameCollection,
  deleteCollection,
} from "../controllers/collectionController.js";

const router = Router();

router.use(requireAuth);

router.post("/", enforceCollectionQuota, createCollection);
router.get("/", listCollections);
router.patch("/:id", renameCollection);
router.delete("/:id", deleteCollection);

export default router;
