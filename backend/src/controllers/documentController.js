import path from "node:path";
import { Document } from "../models/Document.js";
import { Chunk } from "../models/Chunk.js";
import { Collection } from "../models/Collection.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import { queueIngestion } from "../services/ingestionService.js";
import { queueIsFull } from "../services/jobQueue.js";
import { str } from "../middleware/sanitize.js";

const asId = (v) => (typeof v === "string" && /^[a-f\d]{24}$/i.test(v) ? v : null);

const EXT_MIME = {
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".markdown": "text/markdown",
  ".csv": "text/csv",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function normalizeMime(file) {
  const known = [
    "application/pdf",
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (known.includes(file.mimetype)) return file.mimetype;
  const ext = path.extname(file.originalname).toLowerCase();
  return EXT_MIME[ext] || file.mimetype;
}

export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("No file uploaded (field name: 'file')");
  if (queueIsFull()) {
    throw new ApiError(503, "Ingestion is busy right now — please retry shortly.");
  }

  let collectionId = asId(req.body?.collectionId);
  if (collectionId) {
    const owned = await Collection.exists({
      _id: collectionId,
      userId: req.user.id,
    });
    if (!owned) throw ApiError.badRequest("Unknown collectionId");
  }

  const mimeType = normalizeMime(req.file);

  const doc = await Document.create({
    userId: req.user.id,
    collectionId,
    filename: req.file.originalname,
    mimeType,
    sizeBytes: req.file.size,
    status: "processing",
  });

  await queueIngestion({
    documentId: doc._id,
    userId: req.user.id,
    collectionId,
    file: { ...req.file, mimetype: mimeType },
  });

  res.status(202).json({ document: doc });
});

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const listDocuments = asyncHandler(async (req, res) => {
  const query = { userId: req.user.id };
  const qCol = asId(req.query.collectionId);
  if (qCol) query.collectionId = qCol;
  if (["processing", "ready", "failed"].includes(req.query.status)) {
    query.status = req.query.status;
  }
  const q = str(req.query.q).trim();
  if (q) query.filename = { $regex: escapeRegex(q), $options: "i" };

  const page = Math.max(Number(req.query.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);

  const [documents, total] = await Promise.all([
    Document.find(query)
      .sort({ uploadedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Document.countDocuments(query),
  ]);

  res.json({
    documents,
    total,
    page,
    pageSize,
    pages: Math.max(Math.ceil(total / pageSize), 1),
  });
});

export const getDocument = asyncHandler(async (req, res) => {
  const document = await Document.findOne({
    _id: req.params.id,
    userId: req.user.id,
  }).lean();
  if (!document) throw ApiError.notFound("Document not found");
  res.json({ document });
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id,
  });
  if (!document) throw ApiError.notFound("Document not found");

  await Chunk.deleteMany({ documentId: document._id, userId: req.user.id });
  res.status(204).end();
});
