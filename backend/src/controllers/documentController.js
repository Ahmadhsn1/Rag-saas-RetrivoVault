import { Document } from "../models/Document.js";
import { Chunk } from "../models/Chunk.js";
import { Collection } from "../models/Collection.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import { ingestDocument } from "../services/ingestionService.js";

export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("No file uploaded (field name: 'file')");

  let { collectionId } = req.body || {};
  if (collectionId) {
    const owned = await Collection.exists({
      _id: collectionId,
      userId: req.user.id,
    });
    if (!owned) throw ApiError.badRequest("Unknown collectionId");
  } else {
    collectionId = null;
  }

  const doc = await Document.create({
    userId: req.user.id,
    collectionId,
    filename: req.file.originalname,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    status: "processing",
  });

  // Fire-and-forget ingestion; client polls GET /api/documents for status.
  ingestDocument({
    documentId: doc._id,
    userId: req.user.id,
    collectionId,
    file: req.file,
  });

  res.status(202).json({ document: doc });
});

export const listDocuments = asyncHandler(async (req, res) => {
  const query = { userId: req.user.id };
  if (req.query.collectionId) query.collectionId = req.query.collectionId;

  const documents = await Document.find(query).sort({ uploadedAt: -1 }).lean();
  res.json({ documents });
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
