// src/controllers/appointmentController.js

const { pool } = require("../config/db");
const appointmentModel = require("../models/appointmentModel");
const donorModel = require("../models/donorModel");
const bloodBankModel = require("../models/bloodBankModel");
const inventoryModel = require("../models/inventoryModel");
const emailService = require("../services/emailService");
const { VALID_BLOOD_GROUPS, MINIMUM_DONATION_WEIGHT_KG } = require("../utils/constants");

// Whole blood is typically usable for ~42 days after collection — used to
// auto-set an expiry date on the inventory batch created from a completed
// donation, so the bank doesn't have to enter it manually every time.
const SHELF_LIFE_DAYS = 42;

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().slice(0, 10);
}

/**
 * POST /api/appointments
 * PROTECTED, user only — but ALSO requires an existing donor profile
 * (checked below). Books a donation appointment at a chosen bank and
 * issues a unique token number.
 */
async function bookAppointment(req, res) {
  const {
    bloodBankId, appointmentTime,
    weightKg, heightCm, hasChronicIllness, illnessDetails,
  } = req.body;

  if (!bloodBankId || !appointmentTime) {
    return res.status(400).json({
      success: false,
      message: "bloodBankId and appointmentTime are required.",
    });
  }

  const appointmentDate = new Date(appointmentTime);
  if (isNaN(appointmentDate.getTime())) {
    return res.status(400).json({ success: false, message: "appointmentTime must be a valid date/time." });
  }
  if (appointmentDate <= new Date()) {
    return res.status(400).json({ success: false, message: "appointmentTime must be in the future." });
  }

  // Screening fields are required — collected fresh at every booking,
  // since weight and health status can change between donations.
  if (weightKg == null || heightCm == null) {
    return res.status(400).json({
      success: false,
      message: "weightKg and heightCm are required to book a donation.",
    });
  }
  if (weightKg <= 0 || weightKg > 300) {
    return res.status(400).json({ success: false, message: "Please enter a valid weight in kg." });
  }
  if (heightCm <= 0 || heightCm > 250) {
    return res.status(400).json({ success: false, message: "Please enter a valid height in cm." });
  }
  if (hasChronicIllness && !illnessDetails) {
    return res.status(400).json({
      success: false,
      message: "Please briefly describe the condition if you indicated a chronic illness.",
    });
  }

  const donor = await donorModel.findDonorByUserId(req.user.id);
  if (!donor) {
    return res.status(403).json({
      success: false,
      message: "You must have a donor profile to book a donation appointment. Register as a donor first.",
    });
  }

  const bank = await bloodBankModel.findBloodBankById(bloodBankId);
  if (!bank) {
    return res.status(404).json({ success: false, message: "Blood bank not found." });
  }

  // Soft, informational only — never blocks booking. The blood bank's
  // own screening at the appointment is the real medical gate, not this
  // system. We just surface it so the bank sees it on their side too.
  const meetsWeightGuideline = weightKg >= MINIMUM_DONATION_WEIGHT_KG;

  const tokenNumber = appointmentModel.generateTokenNumber();
  const appointmentId = await appointmentModel.createAppointment({
    donorId: donor.id,
    bloodBankId,
    appointmentTime,
    tokenNumber,
    weightKg,
    heightCm,
    hasChronicIllness: !!hasChronicIllness,
    illnessDetails,
    meetsWeightGuideline,
  });

  res.status(201).json({
    success: true,
    message: "Appointment booked successfully.",
    appointment: {
      id: appointmentId,
      tokenNumber,
      bloodBankId,
      appointmentTime,
      status: "pending",
      meetsWeightGuideline,
      ...(!meetsWeightGuideline && {
        note: `Your recorded weight is below the typical ${MINIMUM_DONATION_WEIGHT_KG}kg guideline for whole-blood donation. The blood bank's medical staff will confirm your eligibility at the appointment — this is not a rejection.`,
      }),
    },
  });
}

/**
 * GET /api/appointments/me
 * PROTECTED, user only. The logged-in donor's own appointment history.
 */
async function getMyAppointments(req, res) {
  const donor = await donorModel.findDonorByUserId(req.user.id);
  if (!donor) {
    return res.status(404).json({ success: false, message: "You do not have a donor profile." });
  }
  const appointments = await appointmentModel.findAppointmentsByDonor(donor.id);
  res.status(200).json({ success: true, appointments });
}

/**
 * PATCH /api/appointments/:id/cancel
 * PROTECTED, user only. Donor can cancel their own appointment, but only
 * while it's still pending.
 */
async function cancelAppointment(req, res) {
  const { id } = req.params;

  const appointment = await appointmentModel.findAppointmentById(id);
  if (!appointment) {
    return res.status(404).json({ success: false, message: "Appointment not found." });
  }

  const donor = await donorModel.findDonorByUserId(req.user.id);
  if (!donor || appointment.donor_id !== donor.id) {
    return res.status(403).json({ success: false, message: "You can only cancel your own appointments." });
  }
  if (appointment.status !== "pending") {
    return res.status(409).json({
      success: false,
      message: `Cannot cancel an appointment that is already '${appointment.status}'.`,
    });
  }

  await appointmentModel.updateStatus(id, "cancelled");
  res.status(200).json({ success: true, message: "Appointment cancelled." });
}

/**
 * GET /api/appointments/bank?status=pending
 * PROTECTED, blood_bank only. All appointments booked at the logged-in bank.
 */
async function getBankAppointments(req, res) {
  const bank = await bloodBankModel.findBloodBankByUserId(req.user.id);
  if (!bank) {
    return res.status(404).json({ success: false, message: "Blood bank profile not found for this account." });
  }
  const { status } = req.query;
  const appointments = await appointmentModel.findAppointmentsByBank(bank.id, status);
  res.status(200).json({ success: true, appointments });
}

/**
 * PUT /api/appointments/:id/complete
 * PROTECTED, blood_bank only. Called when the donor physically shows up
 * and donates — per project design, this is a MANUAL confirmation by
 * bank staff, not automatic check-in.
 *
 * Three things must happen together, hence the transaction:
 *   1. donor_appointments.status -> 'completed'
 *   2. a `donations` row is recorded (history)
 *   3. a NEW blood_inventory batch is created for the donated units
 * If any step fails, all three roll back — we never want a donation
 * "recorded" without the stock actually being added, or vice versa.
 */
async function markAsCompleted(req, res) {
  const { id } = req.params;
  const unitsDonated = req.body.unitsDonated || 1; // whole blood donation = 1 unit by default

  const bank = await bloodBankModel.findBloodBankByUserId(req.user.id);
  if (!bank) {
    return res.status(404).json({ success: false, message: "Blood bank profile not found for this account." });
  }

  const appointment = await appointmentModel.findAppointmentById(id);
  if (!appointment) {
    return res.status(404).json({ success: false, message: "Appointment not found." });
  }
  if (appointment.blood_bank_id !== bank.id) {
    return res.status(403).json({ success: false, message: "This appointment is not booked at your bank." });
  }
  if (appointment.status !== "pending") {
    return res.status(409).json({
      success: false,
      message: `Cannot complete an appointment that is already '${appointment.status}'.`,
    });
  }

  // Need the donor's blood group to record the donation and stock it correctly.
  const [[donorRow]] = await pool.query("SELECT blood_group FROM donors WHERE id = ?", [appointment.donor_id]);
  if (!donorRow) {
    return res.status(404).json({ success: false, message: "Donor profile not found." });
  }

  const today = new Date().toISOString().slice(0, 10);
  const expiryDate = addDays(new Date(), SHELF_LIFE_DAYS);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await appointmentModel.recordDonation(
      {
        donorId: appointment.donor_id,
        bloodBankId: bank.id,
        bloodGroup: donorRow.blood_group,
        unitsDonated,
        donationDate: today,
      },
      connection
    );

    await inventoryModel.createBatch(
      {
        bloodBankId: bank.id,
        bloodGroup: donorRow.blood_group,
        quantityUnits: unitsDonated,
        collectionDate: today,
        expiryDate,
      },
      connection
    );

    await appointmentModel.updateStatus(id, "completed", connection);

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  res.status(200).json({
    success: true,
    message: "Donation recorded and inventory updated.",
    appointmentId: Number(id),
    bloodGroup: donorRow.blood_group,
    unitsAdded: unitsDonated,
  });
}

/**
 * PUT /api/appointments/:id/missed
 * PROTECTED, blood_bank only. Manual flag for a no-show — no inventory
 * or donation impact, just a status change for the bank's own records.
 */
async function markAsMissed(req, res) {
  const { id } = req.params;

  const bank = await bloodBankModel.findBloodBankByUserId(req.user.id);
  if (!bank) {
    return res.status(404).json({ success: false, message: "Blood bank profile not found for this account." });
  }

  const appointment = await appointmentModel.findAppointmentById(id);
  if (!appointment) {
    return res.status(404).json({ success: false, message: "Appointment not found." });
  }
  if (appointment.blood_bank_id !== bank.id) {
    return res.status(403).json({ success: false, message: "This appointment is not booked at your bank." });
  }
  if (appointment.status !== "pending") {
    return res.status(409).json({
      success: false,
      message: `Cannot mark as missed an appointment that is already '${appointment.status}'.`,
    });
  }

  await appointmentModel.updateStatus(id, "missed");
  res.status(200).json({ success: true, message: "Appointment marked as missed." });
}

/**
 * GET /api/appointments/fallback-donor?bloodBankId=1&bloodGroup=O+
 * PROTECTED — any logged-in user. This is the donor-fallback feature:
 * only surfaces donor info when the bank's own inventory for that group
 * is genuinely empty. Returns name + blood group + appointment time ONLY —
 * never contact info, per the privacy decision made during planning.
 */
async function getFallbackDonors(req, res) {
  const { bloodBankId, bloodGroup } = req.query;

  if (!bloodBankId || !bloodGroup) {
    return res.status(400).json({
      success: false,
      message: "bloodBankId and bloodGroup query parameters are required.",
    });
  }
  if (!VALID_BLOOD_GROUPS.includes(bloodGroup)) {
    return res.status(400).json({ success: false, message: "Invalid blood group." });
  }

  const stockTotal = await inventoryModel.getBankGroupTotal(bloodBankId, bloodGroup);
  if (stockTotal > 0) {
    return res.status(200).json({
      success: true,
      stockAvailable: true,
      message: "This bank has stock available — no fallback donor needed.",
      donors: [],
    });
  }

  const donors = await appointmentModel.findFallbackDonors(bloodBankId, bloodGroup);
  res.status(200).json({
    success: true,
    stockAvailable: false,
    count: donors.length,
    donors, // { appointment_id, appointment_time, donor_name, blood_group } only
  });
}

/**
 * POST /api/appointments/:id/nudge
 * PROTECTED, user only. Sends a system-mediated email to the donor asking
 * them to come in, WITHOUT ever exposing the donor's email to the
 * requester. Enforced to happen at most once per (appointment, requester)
 * pair — both here and via the donor_nudges UNIQUE constraint.
 */
async function nudgeDonor(req, res) {
  const { id } = req.params;

  const appointment = await appointmentModel.findAppointmentById(id);
  if (!appointment) {
    return res.status(404).json({ success: false, message: "Appointment not found." });
  }
  if (appointment.status !== "pending") {
    return res.status(409).json({
      success: false,
      message: "This donor's appointment is no longer pending.",
    });
  }

  const alreadyNudged = await appointmentModel.hasNudged(id, req.user.id);
  if (alreadyNudged) {
    return res.status(409).json({
      success: false,
      message: "You have already sent a request to this donor.",
    });
  }

  // Record the nudge FIRST — the UNIQUE constraint is our real guarantee
  // against double-requesting; if this insert fails (race condition,
  // someone else's request landed a moment earlier), we stop here rather
  // than also sending a duplicate email.
  await appointmentModel.createNudge(id, req.user.id);

  const details = await appointmentModel.findAppointmentWithDonorEmail(id);
  if (details) {
    await emailService.sendEmail(
      details.donor_email,
      "Someone needs your blood donation",
      `Hi ${details.donor_name},\n\nA patient urgently needs ${appointment.status === "pending" ? "your blood group" : ""} at ${details.bank_name}, where you have a pending donation appointment. If you're able, please consider visiting at your scheduled time.\n\n— Smart Blood Bank System`
    );
  }

  res.status(200).json({
    success: true,
    message: "Request sent to the donor.",
  });
}

module.exports = {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  getBankAppointments,
  markAsCompleted,
  markAsMissed,
  getFallbackDonors,
  nudgeDonor,
};