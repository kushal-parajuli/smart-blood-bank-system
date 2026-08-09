// src/controllers/donorController.js

const donorModel = require("../models/donorModel");

/**
 * POST /api/donors/register
 * PROTECTED — the person must already be logged in as a normal user.
 * This is deliberately NOT a public route like blood bank registration:
 * per the project design, "donor" is a role a user opts into from their
 * own account (clicking "Donate Blood"), not a separate account someone
 * creates from scratch. req.user.id comes from the verified JWT, not
 * from the request body — so nobody can register a donor profile
 * under someone else's account.
 */
async function registerAsDonor(req, res) {
  const { bloodGroup, address, city, district, province, latitude, longitude } = req.body;

  if (!bloodGroup) {
    return res.status(400).json({ success: false, message: "Blood group is required." });
  }

  if (!donorModel.VALID_BLOOD_GROUPS.includes(bloodGroup)) {
    return res.status(400).json({
      success: false,
      message: `Invalid blood group. Must be one of: ${donorModel.VALID_BLOOD_GROUPS.join(", ")}.`,
    });
  }

  if (latitude != null && (latitude < -90 || latitude > 90)) {
    return res.status(400).json({ success: false, message: "Invalid latitude value." });
  }
  if (longitude != null && (longitude < -180 || longitude > 180)) {
    return res.status(400).json({ success: false, message: "Invalid longitude value." });
  }

  const existing = await donorModel.findDonorByUserId(req.user.id);
  if (existing) {
    return res.status(409).json({
      success: false,
      message: "You are already registered as a donor.",
    });
  }

  const donorId = await donorModel.createDonor({
    userId: req.user.id,
    bloodGroup,
    address,
    city,
    district,
    province,
    latitude,
    longitude,
  });

  res.status(201).json({
    success: true,
    message: "Donor registration successful.",
    donor: { id: donorId, bloodGroup, isVerifiedByAdmin: false },
  });
}

/**
 * GET /api/donors/me
 * PROTECTED — returns the logged-in user's own donor profile, if they have one.
 */
async function getMyDonorProfile(req, res) {
  const donor = await donorModel.findDonorByUserId(req.user.id);
  if (!donor) {
    return res.status(404).json({
      success: false,
      message: "You do not have a donor profile yet.",
    });
  }
  res.status(200).json({ success: true, donor });
}

module.exports = { registerAsDonor, getMyDonorProfile };