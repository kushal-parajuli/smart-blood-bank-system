// src/models/donorModel.js
//
// All raw SQL touching the `donors` table.

const { pool } = require("../config/db");
const { VALID_BLOOD_GROUPS } = require("../utils/constants");

/**
 * Checks whether the given user already has a donor profile — a user
 * should only ever have ONE donor profile (enforced at the DB level via
 * UNIQUE on donors.user_id too; this is the friendly pre-check).
 */
async function findDonorByUserId(userId) {
  const [rows] = await pool.query("SELECT * FROM donors WHERE user_id = ?", [userId]);
  return rows[0] || null;
}

/**
 * Creates a donor profile linked to an existing user account.
 */
async function createDonor({
  userId, bloodGroup, address, city, district, province, latitude, longitude,
}) {
  const [result] = await pool.query(
    `INSERT INTO donors
       (user_id, blood_group, address, city, district, province, latitude, longitude)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      bloodGroup,
      address || null,
      city || null,
      district || null,
      province || null,
      latitude ?? null,
      longitude ?? null,
    ]
  );
  return result.insertId;
}

/**
 * Fetches a donor profile with the linked user's contact info attached —
 * used for the donor's own profile view, and later by blood banks viewing
 * their donor list.
 */
async function findDonorWithUserById(donorId) {
  const [rows] = await pool.query(
    `SELECT d.id, d.blood_group, d.address, d.city, d.district, d.province,
            d.latitude, d.longitude, d.last_donation_date, d.is_available,
            d.is_verified_by_admin, d.created_at,
            u.id AS user_id, u.name, u.email, u.phone
     FROM donors d
     JOIN users u ON d.user_id = u.id
     WHERE d.id = ?`,
    [donorId]
  );
  return rows[0] || null;
}

module.exports = {
  VALID_BLOOD_GROUPS,
  findDonorByUserId,
  createDonor,
  findDonorWithUserById,
};