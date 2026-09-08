import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import pinoHttp from "pino-http";

import { env, billingEnabled, mailEnabled, isTestEnv } from "./config/env.js";
import { logger } from "./config/logger.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import { mongoSanitize } from "./middleware/sanitize.js";
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
import notificationRoutes from "./routes/notificationRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  if (!isTestEnv) {
    app.use(
      pinoHttp({
        logger,
        autoLogging: { ignore: (req) => req.url === "/api/health" },
        customLogLevel: (_req, res, err) => {
          if (res.statusCode >= 500 && res.statusCode < 502) return "error";
          if (res.statusCode >= 500 || err) return "warn";
          if (res.statusCode >= 400) return "info";
          return "info";
        },
      })
    );
  }
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
  app.use(mongoSanitize);

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

  app.use("/api/public", publicRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/documents", documentRoutes);
  app.use("/api/collections", collectionRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/billing", billingRoutes);
  app.use("/api/usage", usageRoutes);
  app.use("/api/keys", apiKeyRoutes);
  app.use("/api/account", accountRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/webhooks", webhookRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
