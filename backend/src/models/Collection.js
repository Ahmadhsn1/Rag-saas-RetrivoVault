import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

collectionSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Collection = mongoose.model("Collection", collectionSchema);
