// src/models/appointmentModel.js
//
// Handles the donor_appointments table, plus recording into `donations`
// at completion time. These two concerns are kept in one file (rather than
// a separate donationModel.js) because they're only ever touched together —
// a donation row is only ever created as a side effect of completing an
// appointment, never independently in this system's current design.

const { pool } = require("../config/db");

/**
 * Generates a human-readable, effectively-unique booking token.
 * Format: DON-YYYYMMDD-XXXXX (XXXXX = random 5-digit number).
 * Not cryptographically unique, but combined with the UNIQUE constraint
 * on donor_appointments.token_number, a collision would simply cause an
 * insert error — astronomically unlikely at this project's real-world scale
 * (a handful of bookings/day), so no retry-loop complexity is added here.
 */
function generateTokenNumber() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(10000 + Math.random() * 90000);
  return `DON-${datePart}-${randomPart}`;
}

async function createAppointment({
  donorId, bloodBankId, appointmentTime, tokenNumber,
  weightKg, heightCm, hasChronicIllness, illnessDetails, meetsWeightGuideline,
}) {
  const [result] = await pool.query(
    `INSERT INTO donor_appointments
       (donor_id, blood_bank_id, token_number, appointment_time,
        weight_kg, height_cm, has_chronic_illness, illness_details, meets_weight_guideline)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      donorId, bloodBankId, tokenNumber, appointmentTime,
      weightKg ?? null,
      heightCm ?? null,
      hasChronicIllness ?? false,
      illnessDetails || null,
      meetsWeightGuideline ?? true,
    ]
  );
  return result.insertId;
}

async function findAppointmentById(id, conn = pool) {
  const [rows] = await conn.query("SELECT * FROM donor_appointments WHERE id = ?", [id]);
  return rows[0] || null;
}

async function findAppointmentsByDonor(donorId) {
  const [rows] = await pool.query(
    `SELECT da.*, bb.bank_name
     FROM donor_appointments da
     JOIN blood_banks bb ON da.blood_bank_id = bb.id
     WHERE da.donor_id = ?
     ORDER BY da.appointment_time DESC`,
    [donorId]
  );
  return rows;
}

async function findAppointmentsByBank(bloodBankId, status) {
  const params = [bloodBankId];
  let query = `
    SELECT da.*, u.name AS donor_name, u.phone AS donor_phone, d.blood_group
    FROM donor_appointments da
    JOIN donors d ON da.donor_id = d.id
    JOIN users u ON d.user_id = u.id
    WHERE da.blood_bank_id = ?
  `;
  if (status) {
    query += " AND da.status = ? ";
    params.push(status);
  }
  query += " ORDER BY da.appointment_time ASC";

  const [rows] = await pool.query(query, params);
  return rows;
}

async function updateStatus(id, status, conn = pool) {
  await conn.query("UPDATE donor_appointments SET status = ? WHERE id = ?", [status, id]);
}

/**
 * DONOR FALLBACK SEARCH — used when a bank's inventory for a blood group
 * is empty (checked by the caller BEFORE calling this) but a donor with
 * a matching pending appointment is booked at that same bank. Returns
 * ONLY name + blood group + appointment timing — deliberately excludes
 * email/phone. This matches the privacy decision made during planning:
 * a requester can see that a matching donor exists and nudge them, but
 * never gets the donor's actual contact details — the system sends the
 * email on the requester's behalf (see nudgeDonor in the controller).
 */
async function findFallbackDonors(bloodBankId, bloodGroup) {
  const [rows] = await pool.query(
    `SELECT da.id AS appointment_id, da.appointment_time, u.name AS donor_name, d.blood_group
     FROM donor_appointments da
     JOIN donors d ON da.donor_id = d.id
     JOIN users u ON d.user_id = u.id
     WHERE da.blood_bank_id = ? AND d.blood_group = ? AND da.status = 'pending'
     ORDER BY da.appointment_time ASC`,
    [bloodBankId, bloodGroup]
  );
  return rows;
}

/**
 * Checks whether THIS requester has already nudged THIS specific
 * appointment — enforces "one request per requester per donor",
 * as decided during planning. The UNIQUE constraint on donor_nudges
 * backs this up at the DB level too; this is the friendly pre-check.
 */
async function hasNudged(appointmentId, requesterId) {
  const [rows] = await pool.query(
    "SELECT id FROM donor_nudges WHERE appointment_id = ? AND requester_id = ?",
    [appointmentId, requesterId]
  );
  return rows.length > 0;
}

async function createNudge(appointmentId, requesterId) {
  const [result] = await pool.query(
    "INSERT INTO donor_nudges (appointment_id, requester_id) VALUES (?, ?)",
    [appointmentId, requesterId]
  );
  return result.insertId;
}

/**
 * Server-side only — fetches the donor's email so the SYSTEM can send
 * the nudge email. This function's result must NEVER be sent back in an
 * API response to the requester; it exists purely for emailService to use.
 */
async function findAppointmentWithDonorEmail(appointmentId) {
  const [rows] = await pool.query(
    `SELECT da.id, da.blood_bank_id, u.name AS donor_name, u.email AS donor_email, bb.bank_name
     FROM donor_appointments da
     JOIN donors d ON da.donor_id = d.id
     JOIN users u ON d.user_id = u.id
     JOIN blood_banks bb ON da.blood_bank_id = bb.id
     WHERE da.id = ?`,
    [appointmentId]
  );
  return rows[0] || null;
}

/**
 * Records a completed donation. Only ever called as part of the
 * "mark as donated" transaction in appointmentController — never on its own,
 * since a donation record without the accompanying inventory increment
 * would be an inconsistent state.
 */
async function recordDonation({ donorId, bloodBankId, bloodGroup, unitsDonated, donationDate }, conn) {
  const [result] = await conn.query(
    `INSERT INTO donations (donor_id, blood_bank_id, blood_group, units_donated, donation_date)
     VALUES (?, ?, ?, ?, ?)`,
    [donorId, bloodBankId, bloodGroup, unitsDonated, donationDate]
  );
  return result.insertId;
}

/**
 * Finds the donor's current pending appointment, if any — used to block
 * booking a second one while one is already outstanding. Only 'pending'
 * counts; completed/missed/cancelled appointments never block a new booking.
 */
async function findPendingAppointmentByDonor(donorId) {
  const [rows] = await pool.query(
    `SELECT da.id, da.appointment_time, bb.bank_name
     FROM donor_appointments da
     JOIN blood_banks bb ON da.blood_bank_id = bb.id
     WHERE da.donor_id = ? AND da.status = 'pending'
     ORDER BY da.appointment_time ASC
     LIMIT 1`,
    [donorId]
  );
  return rows[0] || null;
}

module.exports = {
  generateTokenNumber,
  createAppointment,
  findAppointmentById,
  findAppointmentsByDonor,
  findAppointmentsByBank,
  updateStatus,
  recordDonation,
  findFallbackDonors,
  hasNudged,
  createNudge,
  findAppointmentWithDonorEmail,
  findPendingAppointmentByDonor,
};