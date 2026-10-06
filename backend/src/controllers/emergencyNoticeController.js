// src/controllers/emergencyNoticeController.js
//
// Controller for emergency blood notice broadcast, management, and cancellation.

const emergencyNoticeModel = require("../models/emergencyNoticeModel");
const bloodBankModel = require("../models/bloodBankModel");
const { VALID_BLOOD_GROUPS } = require("../utils/constants");

const VALID_EMERGENCY_LEVELS = ["red", "yellow", "green"];

/**
 * GET /api/emergency-notices/active
 * PUBLIC / AUTHENTICATED
 * Returns all currently active emergency blood notices ordered by priority:
 * Red (urgent) > Yellow (less urgent) > Green (least urgent), then newest first.
 */
async function getActiveNotices(req, res) {
  const notices = await emergencyNoticeModel.getActiveNotices();
  res.status(200).json({
    success: true,
    count: notices.length,
    notices,
  });
}

/**
 * POST /api/emergency-notices
 * PROTECTED: admin or blood_bank.
 * Publishes a new emergency blood notice.
 */
async function createNotice(req, res) {
  const {
    bloodGroup,
    quantityRequired,
    quantityUnit = "units",
    emergencyLevel,
    expiresAt,
    message,
    bloodBankId: requestedBankId,
  } = req.body;

  // 1. Role and ownership resolution
  let resolvedBloodBankId = null;
  if (req.user.role === "blood_bank") {
    const bank = await bloodBankModel.findBloodBankByUserId(req.user.id);
    if (!bank) {
      return res.status(403).json({
        success: false,
        message: "No blood bank profile found for your account.",
      });
    }
    if (bank.verification_status !== "approved" && !bank.is_verified_by_admin) {
      return res.status(403).json({
        success: false,
        message: "Your blood bank profile must be verified by an administrator before publishing emergency notices.",
      });
    }
    // Blood banks can ONLY create notices for themselves
    resolvedBloodBankId = bank.id;
  } else if (req.user.role === "admin") {
    // Admin can optionally link the notice to a specific bank
    if (requestedBankId) {
      const bank = await bloodBankModel.findBloodBankById(Number(requestedBankId));
      if (!bank) {
        return res.status(404).json({
          success: false,
          message: "Specified blood bank facility not found.",
        });
      }
      resolvedBloodBankId = bank.id;
    }
  } else {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to publish emergency notices.",
    });
  }

  // 2. Validate Blood Group
  if (!bloodGroup || !VALID_BLOOD_GROUPS.includes(bloodGroup)) {
    return res.status(400).json({
      success: false,
      message: `Invalid blood group. Must be one of: ${VALID_BLOOD_GROUPS.join(", ")}.`,
    });
  }

  // 3. Validate Quantity Required
  const parsedQty = Number(quantityRequired);
  if (!quantityRequired || isNaN(parsedQty) || !Number.isInteger(parsedQty) || parsedQty <= 0 || parsedQty > 500) {
    return res.status(400).json({
      success: false,
      message: "Quantity required must be a positive integer between 1 and 500 units.",
    });
  }

  // 4. Validate Emergency Level
  const cleanLevel = typeof emergencyLevel === "string" ? emergencyLevel.toLowerCase().trim() : "";
  if (!cleanLevel || !VALID_EMERGENCY_LEVELS.includes(cleanLevel)) {
    return res.status(400).json({
      success: false,
      message: "Emergency level must be one of: 'red' (Urgent), 'yellow' (Less urgent), or 'green' (Least urgent).",
    });
  }

  // 5. Validate Expiry Date/Time
  if (!expiresAt) {
    return res.status(400).json({
      success: false,
      message: "Expiration date and time is required.",
    });
  }

  const parsedExpiry = new Date(expiresAt);
  if (isNaN(parsedExpiry.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Invalid expiration date/time format.",
    });
  }

  const now = new Date();
  if (parsedExpiry <= now) {
    return res.status(400).json({
      success: false,
      message: "Expiration time must be set in the future.",
    });
  }

  // 6. Optional message sanitization
  const trimmedMessage = message && typeof message === "string" ? message.trim().slice(0, 1000) : null;

  // 7. Insert Notice
  const insertId = await emergencyNoticeModel.createEmergencyNotice({
    createdByUserId: req.user.id,
    bloodBankId: resolvedBloodBankId,
    bloodGroup,
    quantityRequired: parsedQty,
    quantityUnit: typeof quantityUnit === "string" ? quantityUnit.slice(0, 20) : "units",
    emergencyLevel: cleanLevel,
    message: trimmedMessage,
    publishedAt: now,
    expiresAt: parsedExpiry,
  });

  const createdNotice = await emergencyNoticeModel.findNoticeById(insertId);

  res.status(201).json({
    success: true,
    message: "Emergency blood notice published successfully.",
    notice: createdNotice,
  });
}

/**
 * GET /api/emergency-notices
 * PROTECTED: admin or blood_bank.
 * Lists notices for the caller's dashboard.
 * - Blood banks only see their own notices.
 * - Admin sees notices across the entire system.
 */
async function listNotices(req, res) {
  const { status, bloodBankId } = req.query;

  let filterBankId = null;
  if (req.user.role === "blood_bank") {
    const bank = await bloodBankModel.findBloodBankByUserId(req.user.id);
    if (!bank) {
      return res.status(404).json({
        success: false,
        message: "Blood bank profile not found.",
      });
    }
    filterBankId = bank.id;
  } else if (req.user.role === "admin") {
    if (bloodBankId) {
      filterBankId = Number(bloodBankId);
    }
  }

  const notices = await emergencyNoticeModel.listNotices({
    bloodBankId: filterBankId,
    status: status || "all",
  });

  res.status(200).json({
    success: true,
    count: notices.length,
    notices,
  });
}

/**
 * GET /api/emergency-notices/:id
 * PUBLIC / AUTHENTICATED
 * Returns details of a specific notice.
 */
async function getNoticeById(req, res) {
  const id = Number(req.params.id);
  const notice = await emergencyNoticeModel.findNoticeById(id);

  if (!notice) {
    return res.status(404).json({
      success: false,
      message: "Emergency notice not found.",
    });
  }

  res.status(200).json({
    success: true,
    notice,
  });
}

/**
 * PATCH /api/emergency-notices/:id/cancel
 * PROTECTED: admin or blood_bank.
 * Manually cancels an active notice.
 */
async function cancelNotice(req, res) {
  const id = Number(req.params.id);
  const notice = await emergencyNoticeModel.findNoticeById(id);

  if (!notice) {
    return res.status(404).json({
      success: false,
      message: "Emergency notice not found.",
    });
  }

  // Authorization and ownership check
  if (req.user.role === "blood_bank") {
    const bank = await bloodBankModel.findBloodBankByUserId(req.user.id);
    if (!bank || (notice.blood_bank_id !== bank.id && notice.created_by_user_id !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel another blood bank facility's emergency notice.",
      });
    }
  }

  if (notice.cancelled_at) {
    return res.status(400).json({
      success: false,
      message: "This notice is already cancelled.",
    });
  }

  if (new Date(notice.expires_at) <= new Date()) {
    return res.status(400).json({
      success: false,
      message: "This notice has already reached its expiration time and is no longer active.",
    });
  }

  await emergencyNoticeModel.cancelNotice(id);

  const updatedNotice = await emergencyNoticeModel.findNoticeById(id);

  res.status(200).json({
    success: true,
    message: "Emergency blood notice cancelled successfully.",
    notice: updatedNotice,
  });
}

module.exports = {
  getActiveNotices,
  createNotice,
  listNotices,
  getNoticeById,
  cancelNotice,
};
