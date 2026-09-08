import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";

/** Requires the authenticated user to be an admin (role or ADMIN_EMAILS). */
export const requireAdmin = asyncHandler(async (req, _res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.unauthorized();

  const isAdmin =
    user.role === "admin" || env.adminEmails.includes(user.email.toLowerCase());
  if (!isAdmin) throw ApiError.forbidden("Admin access required");

  // self-heal the role flag so the UI can rely on it
  if (isAdmin && user.role !== "admin") {
    user.role = "admin";
    await user.save();
  }
  req.adminUser = user;
  next();
});
