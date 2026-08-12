// src/models/notificationModel.js

const { pool } = require("../config/db");

/**
 * Creates an in-app notification for a user. Called internally by other
 * controllers (request status changes, admin verification, etc.) — there's
 * no public "create notification" endpoint; notifications are always a
 * side effect of something else happening, never created directly by a client.
 */
async function createNotification({ userId, type, message }) {
  const [result] = await pool.query(
    "INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)",
    [userId, type, message]
  );
  return result.insertId;
}

async function findByUserId(userId) {
  const [rows] = await pool.query(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );
  return rows;
}

async function countUnread(userId) {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = FALSE",
    [userId]
  );
  return rows[0].unread;
}

/**
 * Ownership-checked: only marks the notification read if it actually
 * belongs to this user — prevents user A from marking user B's
 * notification as read just by guessing an id.
 */
async function markAsRead(id, userId) {
  const [result] = await pool.query(
    "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
    [id, userId]
  );
  return result.affectedRows > 0;
}

async function markAllAsRead(userId) {
  await pool.query(
    "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE",
    [userId]
  );
}

module.exports = {
  createNotification,
  findByUserId,
  countUnread,
  markAsRead,
  markAllAsRead,
};