import multer from "multer";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { SUPPORTED_MIME } from "../utils/textExtractor.js";

// In-memory storage — files are parsed immediately, never persisted to disk.
export const uploadSingle = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    // Some browsers send octet-stream for .md / .csv — fall back to extension.
    const okMime = Boolean(SUPPORTED_MIME[file.mimetype]);
    const okExt = /\.(pdf|txt|md|markdown|csv|docx|html?)$/i.test(file.originalname);
    if (!okMime && !okExt) {
      return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
    }
    cb(null, true);
  },
}).single("file");
