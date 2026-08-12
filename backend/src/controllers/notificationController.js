// src/controllers/notificationController.js
//
// All routes here just require login (protect) — no role restriction,
// since every role (user, blood_bank, admin) can receive notifications
// and should be able to view/manage their own.

const notificationModel = require("../models/notificationModel");

async function getMyNotifications(req, res) {
  const notifications = await notificationModel.findByUserId(req.user.id);
  const unreadCount = await notificationModel.countUnread(req.user.id);
  res.status(200).json({ success: true, unreadCount, notifications });
}

async function markAsRead(req, res) {
  const { id } = req.params;
  const updated = await notificationModel.markAsRead(id, req.user.id);
  if (!updated) {
    return res.status(404).json({
      success: false,
      message: "Notification not found, or it doesn't belong to you.",
    });
  }
  res.status(200).json({ success: true, message: "Marked as read." });
}

async function markAllAsRead(req, res) {
  await notificationModel.markAllAsRead(req.user.id);
  res.status(200).json({ success: true, message: "All notifications marked as read." });
}

module.exports = { getMyNotifications, markAsRead, markAllAsRead };