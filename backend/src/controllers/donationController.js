// src/controllers/donationController.js

const donationModel = require("../models/donationModel");
const donorModel = require("../models/donorModel");
const { DONATION_ELIGIBILITY_INTERVAL_DAYS } = require("../utils/constants");

/**
 * GET /api/donations/me
 * PROTECTED, user only (must have a donor profile).
 *
 * Returns full donation history PLUS a computed "next eligible date" —
 * this is a general guideline only (today's most recent donation date +
 * a fixed interval), not a medical determination. The blood bank's own
 * screening at each appointment is the real authority on eligibility;
 * this number exists purely to give the donor a helpful heads-up.
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

  let nextEligibleDate = null;
  let isEligibleNow = true;

  if (donations.length > 0) {
    const mostRecent = new Date(donations[0].donation_date);
    const eligibleDate = new Date(mostRecent);
    eligibleDate.setDate(eligibleDate.getDate() + DONATION_ELIGIBILITY_INTERVAL_DAYS);

    nextEligibleDate = eligibleDate.toISOString().split("T")[0];
    isEligibleNow = eligibleDate <= new Date();
  }

  res.status(200).json({
    success: true,
    totalDonations: donations.length,
    donations,
    eligibility: {
      isEligibleNow,
      nextEligibleDate,
      guidelineIntervalDays: DONATION_ELIGIBILITY_INTERVAL_DAYS,
      note: "This is a general guideline, not medical advice. The blood bank will confirm your actual eligibility at the time of donation.",
    },
  });
}

module.exports = { getMyDonations };