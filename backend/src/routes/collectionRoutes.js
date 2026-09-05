import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createCollection,
  listCollections,
  deleteCollection,
} from "../controllers/collectionController.js";

const router = Router();

router.use(requireAuth);

router.post("/", createCollection);
router.get("/", listCollections);
router.delete("/:id", deleteCollection);

export default router;
