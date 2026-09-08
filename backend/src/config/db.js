import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

mongoose.set("strictQuery", true);

export async function connectDB() {
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });
  logger.info("connected to MongoDB");
}

export async function disconnectDB() {
  await mongoose.disconnect();
  logger.info("disconnected from MongoDB");
}
