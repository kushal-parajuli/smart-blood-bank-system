// src/controllers/requestController.js

const { pool } = require("../config/db");
const requestModel = require("../models/requestModel");
const bloodBankModel = require("../models/bloodBankModel");
const inventoryModel = require("../models/inventoryModel");
const notificationModel = require("../models/notificationModel");
const { VALID_BLOOD_GROUPS } = require("../utils/constants");

const VALID_URGENCY = ["normal", "urgent", "emergency"];

/**
 * POST /api/requests
 * PROTECTED, user only. bloodBankId is OPTIONAL — a request can be
 * created unassigned (per project decision) and matched to a bank later,
 * either by the user picking one from search results (assignBank below)
 * or, in a future phase, by an automatic nearest-bank suggestion.
 */
async function createRequest(req, res) {
  const { bloodBankId, bloodGroup, unitsNeeded, urgency, aiSessionId, notes } = req.body;

  if (!bloodGroup) {
    return res.status(400).json({ success: false, message: "bloodGroup is required." });
  }
  if (!VALID_BLOOD_GROUPS.includes(bloodGroup)) {
    return res.status(400).json({ success: false, message: "Invalid blood group." });
  }
  if (urgency && !VALID_URGENCY.includes(urgency)) {
    return res.status(400).json({ success: false, message: "Invalid urgency value." });
  }

  const units = unitsNeeded || 1;
  if (units < 1) {
    return res.status(400).json({ success: false, message: "unitsNeeded must be at least 1." });
  }

  // If a bank WAS specified up front, confirm it actually exists —
  // fail clearly now rather than creating a request pointing at a ghost id.
  if (bloodBankId) {
    const bank = await bloodBankModel.findBloodBankById(bloodBankId);
    if (!bank) {
      return res.status(404).json({ success: false, message: "Specified blood bank not found." });
    }
  }

  const requestId = await requestModel.createRequest({
    requesterId: req.user.id,
    bloodBankId,
    bloodGroup,
    unitsNeeded: units,
    urgency,
    aiSessionId,
    notes,
  });

  res.status(201).json({
    success: true,
    message: "Blood request submitted.",
    request: { id: requestId, bloodGroup, unitsNeeded: units, status: "pending", bloodBankId: bloodBankId || null },
  });
}

/**
 * GET /api/requests/me
 * PROTECTED, user only. All of the logged-in user's own requests.
 */
async function getMyRequests(req, res) {
  const requests = await requestModel.findRequestsByRequester(req.user.id);
  res.status(200).json({ success: true, requests });
}

/**
 * PATCH /api/requests/:id/assign-bank
 * PROTECTED, user only. Lets the requester pick a bank AFTER creating
 * an unassigned request (e.g. after browsing /api/inventory/search results).
 * Only works if the request is still unassigned and belongs to this user —
 * both checked before the update runs.
 */
async function assignBank(req, res) {
  const { id } = req.params;
  const { bloodBankId } = req.body;

  if (!bloodBankId) {
    return res.status(400).json({ success: false, message: "bloodBankId is required." });
  }

  const request = await requestModel.findRequestById(id);
  if (!request) {
    return res.status(404).json({ success: false, message: "Request not found." });
  }
  if (request.requester_id !== req.user.id) {
    return res.status(403).json({ success: false, message: "You can only modify your own requests." });
  }
  if (request.blood_bank_id) {
    return res.status(409).json({ success: false, message: "This request is already assigned to a bank." });
  }

  const bank = await bloodBankModel.findBloodBankById(bloodBankId);
  if (!bank) {
    return res.status(404).json({ success: false, message: "Blood bank not found." });
  }

  await requestModel.assignBank(id, bloodBankId);
  res.status(200).json({ success: true, message: "Bank assigned to request.", requestId: Number(id), bloodBankId });
}

/**
 * PATCH /api/requests/:id/cancel
 * PROTECTED, user only. Requester can cancel their own request, but only
 * while it's still pending — once a bank has accepted/fulfilled it,
 * cancelling would need to be a coordinated action, not a unilateral one
 * (out of scope for this milestone).
 */
async function cancelRequest(req, res) {
  const { id } = req.params;

  const request = await requestModel.findRequestById(id);
  if (!request) {
    return res.status(404).json({ success: false, message: "Request not found." });
  }
  if (request.requester_id !== req.user.id) {
    return res.status(403).json({ success: false, message: "You can only cancel your own requests." });
  }
  if (request.status !== "pending") {
    return res.status(409).json({
      success: false,
      message: `Cannot cancel a request that is already '${request.status}'.`,
    });
  }

  await requestModel.updateStatus(id, "cancelled");
  res.status(200).json({ success: true, message: "Request cancelled." });
}

/**
 * GET /api/requests/bank/incoming?status=pending
 * PROTECTED, blood_bank only. All requests assigned to the logged-in bank.
 * `status` query param is optional — omit it to see requests of every status.
 */
async function getBankIncomingRequests(req, res) {
  const bank = await bloodBankModel.findBloodBankByUserId(req.user.id);
  if (!bank) {
    return res.status(404).json({ success: false, message: "Blood bank profile not found for this account." });
  }
  const { status } = req.query;
  const requests = await requestModel.findRequestsByBank(bank.id, status);
  res.status(200).json({ success: true, requests });
}

/**
 * PUT /api/requests/:id/status
 * PROTECTED, blood_bank only. Body: { status: "accepted" | "rejected" | "fulfilled" }
 *
 * The 'fulfilled' transition is the interesting one: it must ALSO deduct
 * the matching stock from inventory, and both the deduction and the status
 * change must succeed together — hence the transaction. If the bank
 * doesn't actually have enough stock, the whole thing rolls back and the
 * request stays in its previous status, rather than silently marking a
 * request "fulfilled" while inventory numbers are wrong.
 */
async function updateRequestStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  const allowedTransitions = ["accepted", "rejected", "fulfilled"];

  if (!allowedTransitions.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${allowedTransitions.join(", ")}.`,
    });
  }

  const bank = await bloodBankModel.findBloodBankByUserId(req.user.id);
  if (!bank) {
    return res.status(404).json({ success: false, message: "Blood bank profile not found for this account." });
  }

  const request = await requestModel.findRequestById(id);
  if (!request) {
    return res.status(404).json({ success: false, message: "Request not found." });
  }
  if (request.blood_bank_id !== bank.id) {
    return res.status(403).json({ success: false, message: "This request is not assigned to your bank." });
  }
  if (request.status !== "pending" && request.status !== "accepted") {
    return res.status(409).json({
      success: false,
      message: `Cannot change status of a request that is already '${request.status}'.`,
    });
  }

  if (status === "fulfilled") {
    // Deduct stock + update status together, atomically.
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await inventoryModel.deductUnitsFEFO(
        bank.id, request.blood_group, request.units_needed, connection
      );
      await requestModel.updateStatus(id, "fulfilled", connection);
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err; // e.g. insufficient stock -> 409, forwarded via asyncHandler
    } finally {
      connection.release();
    }
  } else {
    // accepted / rejected — simple status change, no inventory involved.
    await requestModel.updateStatus(id, status);
  }

  // Notify the requester of the outcome. Deliberately OUTSIDE the
  // transaction above — a notification failing to insert should never
  // roll back a real stock deduction that already succeeded. This is a
  // best-effort side effect, not part of the core guarantee.
  await notificationModel.createNotification({
    userId: request.requester_id,
    type: "request_status",
    message: `Your blood request for ${request.units_needed} unit(s) of ${request.blood_group} at ${bank.bank_name} was ${status}.`,
  });

  res.status(200).json({ success: true, message: `Request marked as ${status}.`, requestId: Number(id), status });
}

module.exports = {
  createRequest,
  getMyRequests,
  assignBank,
  cancelRequest,
  getBankIncomingRequests,
  updateRequestStatus,
};