import mongoose from "mongoose";
import { isProd } from "../config/env.js";
import { logger } from "../config/logger.js";
import { ApiError } from "../utils/ApiError.js";

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Centralized error handler — never leaks stack traces to the client.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  // If a response already started streaming (SSE), we can't send JSON — just end.
  if (res.headersSent) {
    return res.end();
  }

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal server error";
  let details = err.details;

  // Body-parser: malformed JSON, payload too large
  if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Malformed JSON in request body";
    details = undefined;
  } else if (err.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body too large";
    details = undefined;
  }

  // Multer upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "File exceeds the size limit";
  } else if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
    statusCode = 400;
    message = "Upload one file in the 'file' field";
  }

  // Mongoose: bad ObjectId in a param
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}`;
    details = undefined;
  }
  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    message = "Resource already exists";
    details = err.keyValue;
  }
  // Mongoose validation
  if (err.name === "ValidationError" && err.errors) {
    statusCode = 400;
    message = "Validation failed";
    details = Object.fromEntries(
      Object.entries(err.errors).map(([k, v]) => [k, v.message])
    );
  }

  // JWT library errors that slipped through
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Invalid or expired token";
  }

  if (statusCode >= 500) {
    const log = req?.log || logger;
    // Operational upstream failures (502/503) are expected noise, not bugs.
    if (err.isOperational && statusCode < 504) {
      log.warn({ path: req?.originalUrl, cause: err.details?.cause }, message);
    } else {
      log.error({ err, path: req?.originalUrl }, "unhandled error");
    }
    if (isProd) {
      message = statusCode >= 500 && !err.isOperational ? "Internal server error" : message;
      details = undefined;
    }
  }

  res.status(statusCode).json({
    error: message,
    ...(details ? { details } : {}),
  });
}
