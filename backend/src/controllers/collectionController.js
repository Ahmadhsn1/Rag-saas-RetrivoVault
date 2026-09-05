import mongoose from "mongoose";
import { Collection } from "../models/Collection.js";
import { Document } from "../models/Document.js";
import { Chunk } from "../models/Chunk.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";

export const createCollection = asyncHandler(async (req, res) => {
  const name = (req.body?.name || "").trim();
  if (!name) throw ApiError.badRequest("name is required");

  const collection = await Collection.create({ userId: req.user.id, name });
  res.status(201).json({ collection });
});

export const listCollections = asyncHandler(async (req, res) => {
  const collections = await Collection.find({ userId: req.user.id })
    .sort({ createdAt: 1 })
    .lean();

  const counts = await Document.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
    { $group: { _id: "$collectionId", count: { $sum: 1 } } },
  ]).catch(() => []);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  res.json({
    collections: collections.map((c) => ({
      ...c,
      documentCount: countMap.get(String(c._id)) || 0,
    })),
  });
});

export const renameCollection = asyncHandler(async (req, res) => {
  const name = (req.body?.name || "").trim();
  if (!name) throw ApiError.badRequest("name is required");

  const collection = await Collection.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { name },
    { new: true, runValidators: true }
  );
  if (!collection) throw ApiError.notFound("Collection not found");

  res.json({ collection });
});

export const deleteCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id,
  });
  if (!collection) throw ApiError.notFound("Collection not found");

  // Detach documents/chunks rather than deleting the user's data.
  await Document.updateMany(
    { userId: req.user.id, collectionId: collection._id },
    { collectionId: null }
  );
  await Chunk.updateMany(
    { userId: req.user.id, collectionId: collection._id },
    { collectionId: null }
  );

  res.status(204).end();
});
