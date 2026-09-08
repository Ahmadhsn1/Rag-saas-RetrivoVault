import { asyncHandler } from "../utils/ApiError.js";
import {
  listNotifications,
  markRead,
} from "../services/notifications.js";
import { Notification } from "../models/Notification.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const data = await listNotifications(req.user.id, {
    limit: Number(req.query.limit) || 30,
    unreadOnly: req.query.unread === "true",
  });
  res.json(data);
});

export const readNotifications = asyncHandler(async (req, res) => {
  await markRead(req.user.id, req.body?.ids);
  const { unread } = await listNotifications(req.user.id, { limit: 1 });
  res.json({ unread });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.deleteOne({ _id: req.params.id, userId: req.user.id });
  res.status(204).end();
});
