// src/models/emergencyNoticeModel.js
//
// Raw SQL model for emergency blood shortage broadcast notices.

const { pool } = require("../config/db");

/**
 * Creates a new emergency blood notice.
 */
async function createEmergencyNotice(
  {
    createdByUserId,
    bloodBankId = null,
    bloodGroup,
    quantityRequired = 1,
    quantityUnit = "units",
    emergencyLevel = "red",
    message = null,
    publishedAt = new Date(),
    expiresAt,
  },
  conn = pool
) {
  const [result] = await conn.query(
    `INSERT INTO emergency_blood_notices
       (created_by_user_id, blood_bank_id, blood_group, quantity_required, quantity_unit, emergency_level, message, published_at, expires_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    [
      createdByUserId,
      bloodBankId || null,
      bloodGroup,
      quantityRequired,
      quantityUnit,
      emergencyLevel,
      message || null,
      publishedAt,
      expiresAt,
    ]
  );
  return result.insertId;
}

/**
 * Fetches all currently active notices:
 * - published_at has arrived (<= NOW())
 * - has not reached expires_at (> NOW())
 * - has not been manually cancelled (cancelled_at IS NULL)
 * - status is 'active'
 *
 * Ordered strictly by:
 * 1. Emergency Level: Red (1) > Yellow (2) > Green (3)
 * 2. Newest published notice first (published_at DESC)
 */
async function getActiveNotices(conn = pool) {
  const [rows] = await conn.query(
    `SELECT
       en.id,
       en.created_by_user_id,
       en.blood_bank_id,
       en.blood_group,
       en.quantity_required,
       en.quantity_unit,
       en.emergency_level,
       en.message,
       en.published_at,
       en.expires_at,
       en.cancelled_at,
       en.status,
       en.created_at,
       en.updated_at,
       bb.bank_name,
       bb.address AS bank_address,
       bb.city AS bank_city,
       bb.district AS bank_district,
       bb.province AS bank_province,
       u_bank.phone AS bank_phone,
       u_bank.email AS bank_email,
       u_creator.name AS creator_name,
       r.name AS creator_role
     FROM emergency_blood_notices en
     LEFT JOIN blood_banks bb ON en.blood_bank_id = bb.id
     LEFT JOIN users u_bank ON bb.user_id = u_bank.id
     LEFT JOIN users u_creator ON en.created_by_user_id = u_creator.id
     LEFT JOIN roles r ON u_creator.role_id = r.id
     WHERE en.published_at <= NOW()
       AND en.expires_at > NOW()
       AND en.cancelled_at IS NULL
       AND en.status = 'active'
     ORDER BY
       CASE en.emergency_level
         WHEN 'red' THEN 1
         WHEN 'yellow' THEN 2
         WHEN 'green' THEN 3
         ELSE 4
       END ASC,
       en.published_at DESC,
       en.id DESC`
  );
  return rows;
}

/**
 * Fetches a single notice by primary key with creator and bank info.
 */
async function findNoticeById(id, conn = pool) {
  const [rows] = await conn.query(
    `SELECT
       en.*,
       bb.bank_name,
       bb.address AS bank_address,
       bb.city AS bank_city,
       bb.district AS bank_district,
       bb.province AS bank_province,
       u_bank.phone AS bank_phone,
       u_bank.email AS bank_email,
       u_creator.name AS creator_name,
       r.name AS creator_role,
       CASE
         WHEN en.cancelled_at IS NOT NULL THEN 'cancelled'
         WHEN en.expires_at <= NOW() THEN 'expired'
         ELSE 'active'
       END AS calculated_status
     FROM emergency_blood_notices en
     LEFT JOIN blood_banks bb ON en.blood_bank_id = bb.id
     LEFT JOIN users u_bank ON bb.user_id = u_bank.id
     LEFT JOIN users u_creator ON en.created_by_user_id = u_creator.id
     LEFT JOIN roles r ON u_creator.role_id = r.id
     WHERE en.id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Lists notices for admin/blood bank dashboards with optional filters:
 * - bloodBankId: filter for specific blood bank (e.g. blood bank viewing their own notices)
 * - status: 'active' | 'cancelled' | 'expired' | 'all'
 */
async function listNotices({ bloodBankId, status } = {}, conn = pool) {
  let query = `
    SELECT
      en.id,
      en.created_by_user_id,
      en.blood_bank_id,
      en.blood_group,
      en.quantity_required,
      en.quantity_unit,
      en.emergency_level,
      en.message,
      en.published_at,
      en.expires_at,
      en.cancelled_at,
      CASE
        WHEN en.cancelled_at IS NOT NULL THEN 'cancelled'
        WHEN en.expires_at <= NOW() THEN 'expired'
        ELSE en.status
      END AS status,
      en.created_at,
      en.updated_at,
      bb.bank_name,
      bb.address AS bank_address,
      bb.city AS bank_city,
      bb.district AS bank_district,
      bb.province AS bank_province,
      u_bank.phone AS bank_phone,
      u_bank.email AS bank_email,
      u_creator.name AS creator_name,
      r.name AS creator_role
    FROM emergency_blood_notices en
    LEFT JOIN blood_banks bb ON en.blood_bank_id = bb.id
    LEFT JOIN users u_bank ON bb.user_id = u_bank.id
    LEFT JOIN users u_creator ON en.created_by_user_id = u_creator.id
    LEFT JOIN roles r ON u_creator.role_id = r.id
    WHERE 1=1
  `;
  const params = [];

  if (bloodBankId) {
    query += " AND en.blood_bank_id = ?";
    params.push(bloodBankId);
  }

  if (status && status !== "all") {
    if (status === "active") {
      query += " AND en.cancelled_at IS NULL AND en.expires_at > NOW() AND en.status = 'active'";
    } else if (status === "cancelled") {
      query += " AND (en.cancelled_at IS NOT NULL OR en.status = 'cancelled')";
    } else if (status === "expired") {
      query += " AND en.cancelled_at IS NULL AND en.expires_at <= NOW()";
    }
  }

  query += `
    ORDER BY
      CASE en.emergency_level
        WHEN 'red' THEN 1
        WHEN 'yellow' THEN 2
        WHEN 'green' THEN 3
        ELSE 4
      END ASC,
      en.created_at DESC
  `;

  const [rows] = await conn.query(query, params);
  return rows;
}

/**
 * Manually marks a notice as cancelled before its scheduled expiration.
 */
async function cancelNotice(id, conn = pool) {
  const [result] = await conn.query(
    `UPDATE emergency_blood_notices
     SET cancelled_at = NOW(),
         status = 'cancelled'
     WHERE id = ? AND cancelled_at IS NULL`,
    [id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  createEmergencyNotice,
  getActiveNotices,
  findNoticeById,
  listNotices,
  cancelNotice,
};
