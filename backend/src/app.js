import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

import { env, billingEnabled, mailEnabled } from "./config/env.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import { handleWebhook } from "./controllers/billingController.js";
import { queueStats } from "./services/jobQueue.js";

import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import collectionRoutes from "./routes/collectionRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import usageRoutes from "./routes/usageRoutes.js";
import apiKeyRoutes from "./routes/apiKeyRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(
    cors({
      origin: env.clientOrigin.split(",").map((s) => s.trim()),
      credentials: true,
    })
  );

  // Stripe webhook needs the raw body — mount BEFORE express.json().
  app.post(
    "/api/billing/webhook",
    express.raw({ type: "application/json" }),
    handleWebhook
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) =>
    res.json({ ok: true, service: "retrivo-vault", ts: Date.now() })
  );
  app.get("/api/health/deep", async (_req, res) => {
    const dbUp = mongoose.connection.readyState === 1;
    res.status(dbUp ? 200 : 503).json({
      ok: dbUp,
      db: dbUp ? "up" : "down",
      queue: queueStats(),
      features: { billing: billingEnabled, mail: mailEnabled },
      ts: Date.now(),
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/documents", documentRoutes);
  app.use("/api/collections", collectionRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/billing", billingRoutes);
  app.use("/api/usage", usageRoutes);
  app.use("/api/keys", apiKeyRoutes);
  app.use("/api/account", accountRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
