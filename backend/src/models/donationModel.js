// src/models/donationModel.js
//
// Read-side queries for the `donations` table. Writes happen only via
// appointmentModel.recordDonation, as part of the "Mark as Donated"
// transaction — this file is purely for a donor viewing their own history.

const { pool } = require("../config/db");

async function findDonationsByDonorId(donorId) {
  const [rows] = await pool.query(
    `SELECT d.id, d.blood_group, d.units_donated, d.donation_date, d.created_at,
            bb.bank_name, bb.city
     FROM donations d
     JOIN blood_banks bb ON d.blood_bank_id = bb.id
     WHERE d.donor_id = ?
     ORDER BY d.donation_date DESC`,
    [donorId]
  );
  return rows;
}

module.exports = { findDonationsByDonorId };