// src/models/bloodBankModel.js
//
// All raw SQL touching the `blood_banks` table. Like userModel, every
// function accepts an optional `conn` so it can participate in the same
// transaction as a userModel call (see bloodBankController.register).

const { pool } = require("../config/db");

/**
 * Checks if a license number is already registered — license numbers
 * must be unique (enforced at the DB level too, this is just an early,
 * friendlier check before we hit the DB constraint).
 */
async function findByLicenseNumber(licenseNumber, conn = pool) {
  const [rows] = await conn.query(
    "SELECT id FROM blood_banks WHERE license_number = ?",
    [licenseNumber]
  );
  return rows[0] || null;
}

/**
 * Creates the blood_banks profile row, linked to an existing users row
 * via user_id. latitude/longitude are nullable — a bank can register
 * with just a typed address and add map coordinates later, though
 * without coordinates it won't show up in "nearest bank" search results
 * until it does.
 */
async function createBloodBank(
  { userId, bankName, licenseNumber, address, city, district, province, latitude, longitude },
  conn = pool
) {
  const [result] = await conn.query(
    `INSERT INTO blood_banks
       (user_id, bank_name, license_number, address, city, district, province, latitude, longitude)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      bankName,
      licenseNumber,
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
 * Fetches a full blood bank profile (joined with its user account info)
 * by the blood_banks.id — used later for a bank's own dashboard/profile view.
 */
async function findBloodBankById(id, conn = pool) {
  const [rows] = await conn.query(
    `SELECT bb.id, bb.bank_name, bb.license_number, bb.address, bb.city,
            bb.district, bb.province, bb.latitude, bb.longitude,
            bb.is_verified_by_admin, bb.created_at,
            u.id AS user_id, u.name AS contact_name, u.email, u.phone
     FROM blood_banks bb
     JOIN users u ON bb.user_id = u.id
     WHERE bb.id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Fetches a blood bank profile by its linked user_id — useful once a
 * blood-bank-role user is logged in and we need their bank profile,
 * not just their user row (e.g. for their dashboard).
 */
async function findBloodBankByUserId(userId, conn = pool) {
  const [rows] = await conn.query(
    "SELECT * FROM blood_banks WHERE user_id = ?",
    [userId]
  );
  return rows[0] || null;
}

/**
 * Lists every registered bank — used for the donor booking flow, where
 * someone needs to pick ANY bank to donate at (not filtered by stock,
 * unlike inventory search which requires a blood group). Unverified
 * banks are still included but flagged, so the frontend can show that
 * status rather than silently hiding them.
 */
async function findAllBanks(conn = pool) {
  const [rows] = await conn.query(
    `SELECT id, bank_name, city, district, province, latitude, longitude, is_verified_by_admin
     FROM blood_banks
     ORDER BY bank_name`
  );
  return rows;
}

module.exports = {
  findByLicenseNumber,
  createBloodBank,
  findBloodBankById,
  findBloodBankByUserId,
  findAllBanks,
};