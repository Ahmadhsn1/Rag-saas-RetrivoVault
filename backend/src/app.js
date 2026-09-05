import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import collectionRoutes from "./routes/collectionRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(
    cors({
      origin: env.clientOrigin.split(",").map((s) => s.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) =>
    res.json({ ok: true, service: "retrivo-vault", ts: Date.now() })
  );

  app.use("/api/auth", authRoutes);
  app.use("/api/documents", documentRoutes);
  app.use("/api/collections", collectionRoutes);
  app.use("/api/chat", chatRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
