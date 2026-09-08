import pino from "pino";
import { isProd, isTestEnv } from "./env.js";

export const logger = pino({
  level: isTestEnv ? "silent" : process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'req.headers["x-api-key"]',
      'req.headers["stripe-signature"]',
    ],
    remove: true,
  },
});
