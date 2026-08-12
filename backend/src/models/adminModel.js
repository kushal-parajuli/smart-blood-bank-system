// src/models/adminModel.js
//
// Admin-specific queries live here rather than scattered across
// bloodBankModel/donorModel/userModel, since these are admin-context
// operations (verifying, suspending, reporting) on data that other
// modules own for their own self-service purposes — keeping them
// together makes it obvious this whole file requires admin privileges.

const { pool } = require("../config/db");

// --- Blood bank verification ---

async function getUnverifiedBloodBanks() {
  const [rows] = await pool.query(
    `SELECT bb.id, bb.bank_name, bb.license_number, bb.city, bb.district, bb.province,
            bb.created_at, u.name AS contact_name, u.email, u.phone
     FROM blood_banks bb
     JOIN users u ON bb.user_id = u.id
     WHERE bb.is_verified_by_admin = FALSE
     ORDER BY bb.created_at ASC`
  );
  return rows;
}

async function verifyBloodBank(id) {
  const [result] = await pool.query(
    "UPDATE blood_banks SET is_verified_by_admin = TRUE WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}

// --- Donor verification ---

async function getUnverifiedDonors() {
  const [rows] = await pool.query(
    `SELECT d.id, d.blood_group, d.city, d.district, d.province, d.created_at,
            u.name, u.email, u.phone
     FROM donors d
     JOIN users u ON d.user_id = u.id
     WHERE d.is_verified_by_admin = FALSE
     ORDER BY d.created_at ASC`
  );
  return rows;
}

async function verifyDonor(id) {
  const [result] = await pool.query(
    "UPDATE donors SET is_verified_by_admin = TRUE WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}

// --- User management ---

/**
 * Lists all users, optionally filtered by role name ('user' | 'blood_bank' | 'admin').
 * Password hash is never selected — this data may be displayed in an admin UI.
 */
async function getAllUsers(roleName) {
  const params = [];
  let query = `
    SELECT u.id, u.name, u.email, u.phone, u.is_verified, u.is_suspended,
           u.created_at, r.name AS role
    FROM users u
    JOIN roles r ON u.role_id = r.id
  `;
  if (roleName) {
    query += " WHERE r.name = ? ";
    params.push(roleName);
  }
  query += " ORDER BY u.created_at DESC";

  const [rows] = await pool.query(query, params);
  return rows;
}

async function setSuspended(userId, suspended) {
  const [result] = await pool.query(
    "UPDATE users SET is_suspended = ? WHERE id = ?",
    [suspended, userId]
  );
  return result.affectedRows > 0;
}

// --- System stats (for a simple admin dashboard) ---

async function getSystemStats() {
  const [[userCounts]] = await pool.query(`
    SELECT
      COUNT(*) AS total_users,
      SUM(r.name = 'user') AS normal_users,
      SUM(r.name = 'blood_bank') AS blood_banks,
      SUM(r.name = 'admin') AS admins,
      SUM(u.is_suspended = TRUE) AS suspended_users
    FROM users u JOIN roles r ON u.role_id = r.id
  `);

  const [[bankStats]] = await pool.query(`
    SELECT COUNT(*) AS total_banks,
           SUM(is_verified_by_admin = TRUE) AS verified_banks
    FROM blood_banks
  `);

  const [[donorStats]] = await pool.query(`
    SELECT COUNT(*) AS total_donors,
           SUM(is_verified_by_admin = TRUE) AS verified_donors
    FROM donors
  `);

  const [[requestStats]] = await pool.query(`
    SELECT COUNT(*) AS total_requests,
           SUM(status = 'pending') AS pending_requests,
           SUM(status = 'fulfilled') AS fulfilled_requests
    FROM blood_requests
  `);

  const [[donationStats]] = await pool.query(`
    SELECT COUNT(*) AS total_donations, COALESCE(SUM(units_donated), 0) AS total_units_donated
    FROM donations
  `);

  return {
    users: userCounts,
    bloodBanks: bankStats,
    donors: donorStats,
    requests: requestStats,
    donations: donationStats,
  };
}

module.exports = {
  getUnverifiedBloodBanks,
  verifyBloodBank,
  getUnverifiedDonors,
  verifyDonor,
  getAllUsers,
  setSuspended,
  getSystemStats,
};