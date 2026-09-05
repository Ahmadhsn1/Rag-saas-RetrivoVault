import mongoose from "mongoose";
import { env } from "./env.js";

mongoose.set("strictQuery", true);

export async function connectDB() {
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log("[db] connected to MongoDB");
}

export async function disconnectDB() {
  await mongoose.disconnect();
  console.log("[db] disconnected");
}
