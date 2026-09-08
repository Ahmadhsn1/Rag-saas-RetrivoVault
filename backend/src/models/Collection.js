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
    // Optional persona / rules prepended to the prompt for chats scoped here.
    instructions: { type: String, default: "", maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

collectionSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Collection = mongoose.model("Collection", collectionSchema);
