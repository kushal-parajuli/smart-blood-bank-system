// src/controllers/donationController.js

const donationModel = require("../models/donationModel");
const donorModel = require("../models/donorModel");
const { DONATION_ELIGIBILITY_INTERVAL_DAYS } = require("../utils/constants");
const { computeEligibility } = require("../utils/eligibility");

/**
 * GET /api/donations/me
 * PROTECTED, user only (must have a donor profile).
 *
 * Returns full donation history PLUS a computed "next eligible date" —
 * this is a general guideline only (today's most recent donation date +
 * a fixed interval), not a medical determination. The blood bank's own
 * screening at each appointment is the real authority on eligibility;
 * this number exists purely to give the donor a helpful heads-up.
 *
 * Uses the SAME computeEligibility() helper that appointmentController
 * enforces against when booking — this endpoint is informational, that
 * one is the actual gate, but both must agree on the same date.
 */
async function getMyDonations(req, res) {
  const donor = await donorModel.findDonorByUserId(req.user.id);
  if (!donor) {
    return res.status(404).json({
      success: false,
      message: "You do not have a donor profile yet.",
    });
  }

  const donations = await donationModel.findDonationsByDonorId(donor.id);
  const eligibility = computeEligibility(donations);

  res.status(200).json({
    success: true,
    totalDonations: donations.length,
    donations,
    eligibility: {
      ...eligibility,
      guidelineIntervalDays: DONATION_ELIGIBILITY_INTERVAL_DAYS,
      note: "This is a general guideline, not medical advice. The blood bank will confirm your actual eligibility at the time of donation.",
    },
  });
}

module.exports = { getMyDonations };