// src/controllers/adminController.js
//
// Every function here is only ever reachable via routes protected with
// authorize("admin") — see adminRoutes.js. No route in this controller
// should ever be mounted without that check.

const adminModel = require("../models/adminModel");
const bloodBankModel = require("../models/bloodBankModel");
const donorModel = require("../models/donorModel");
const notificationModel = require("../models/notificationModel");

async function getUnverifiedBloodBanks(req, res) {
  const banks = await adminModel.getUnverifiedBloodBanks();
  res.status(200).json({ success: true, count: banks.length, banks });
}

async function verifyBloodBank(req, res) {
  const { id } = req.params;
  const updated = await adminModel.verifyBloodBank(id);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Blood bank not found." });
  }

  const bank = await bloodBankModel.findBloodBankById(id);
  if (bank) {
    await notificationModel.createNotification({
      userId: bank.user_id,
      type: "system",
      message: `Your blood bank "${bank.bank_name}" has been verified by an administrator.`,
    });
  }

  res.status(200).json({ success: true, message: "Blood bank verified.", bloodBankId: Number(id) });
}

async function getUnverifiedDonors(req, res) {
  const donors = await adminModel.getUnverifiedDonors();
  res.status(200).json({ success: true, count: donors.length, donors });
}

async function verifyDonor(req, res) {
  const { id } = req.params;
  const updated = await adminModel.verifyDonor(id);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Donor not found." });
  }

  const donor = await donorModel.findDonorWithUserById(id);
  if (donor) {
    await notificationModel.createNotification({
      userId: donor.user_id,
      type: "system",
      message: "Your donor profile has been verified by an administrator.",
    });
  }

  res.status(200).json({ success: true, message: "Donor verified.", donorId: Number(id) });
}

/**
 * GET /api/admin/users?role=blood_bank
 * `role` query param is optional — omit to list every user.
 */
async function getAllUsers(req, res) {
  const { role } = req.query;
  const users = await adminModel.getAllUsers(role);
  res.status(200).json({ success: true, count: users.length, users });
}

/**
 * PUT /api/admin/users/:id/suspend
 * Blocks the user from logging in (authController.login checks
 * is_suspended and rejects with a clear message) without deleting
 * their account or data.
 */
async function suspendUser(req, res) {
  const { id } = req.params;

  if (Number(id) === req.user.id) {
    return res.status(400).json({ success: false, message: "You cannot suspend your own account." });
  }

  const updated = await adminModel.setSuspended(id, true);
  if (!updated) {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  res.status(200).json({ success: true, message: "User suspended.", userId: Number(id) });
}

async function unsuspendUser(req, res) {
  const { id } = req.params;
  const updated = await adminModel.setSuspended(id, false);
  if (!updated) {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  res.status(200).json({ success: true, message: "User unsuspended.", userId: Number(id) });
}

async function getSystemStats(req, res) {
  const stats = await adminModel.getSystemStats();
  res.status(200).json({ success: true, stats });
}

module.exports = {
  getUnverifiedBloodBanks,
  verifyBloodBank,
  getUnverifiedDonors,
  verifyDonor,
  getAllUsers,
  suspendUser,
  unsuspendUser,
  getSystemStats,
};