import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

userSchema.methods.toJSON = function () {
  const { passwordHash, __v, ...rest } = this.toObject();
  return rest;
};

export const User = mongoose.model("User", userSchema);
