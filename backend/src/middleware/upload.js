import multer from "multer";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

const ALLOWED = new Set(["application/pdf", "text/plain"]);

// In-memory storage — files are parsed immediately, never persisted to disk.
export const uploadSingle = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
    }
    cb(null, true);
  },
}).single("file");
