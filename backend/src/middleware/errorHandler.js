import { isProd } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Centralized error handler — never leaks stack traces to the client.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let details = err.details;

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    message = "Resource already exists";
    details = err.keyValue;
  }
  // Mongoose validation
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    details = Object.fromEntries(
      Object.entries(err.errors).map(([k, v]) => [k, v.message])
    );
  }

  if (statusCode >= 500) {
    console.error("[error]", err);
    if (isProd) message = "Internal server error";
  }

  res.status(statusCode).json({
    error: message,
    ...(details ? { details } : {}),
  });
}
