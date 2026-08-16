// src/utils/eligibility.js
//
// Single source of truth for "when can this donor donate again," used
// by both GET /api/donations/me (informational) and the booking check
// in appointmentController (enforced). Keeping it in one place means
// the two can never quietly drift out of sync with each other.

const { DONATION_ELIGIBILITY_INTERVAL_DAYS } = require("./constants");

/**
 * @param {Array<{donation_date: string|Date}>} donations - ordered most-recent-first
 * @returns {{isEligibleNow: boolean, nextEligibleDate: string|null}}
 */
function computeEligibility(donations) {
  if (!donations || donations.length === 0) {
    return { isEligibleNow: true, nextEligibleDate: null };
  }

  const mostRecent = new Date(donations[0].donation_date);
  const eligibleDate = new Date(mostRecent);
  eligibleDate.setDate(eligibleDate.getDate() + DONATION_ELIGIBILITY_INTERVAL_DAYS);

  return {
    isEligibleNow: eligibleDate <= new Date(),
    nextEligibleDate: eligibleDate.toISOString().split("T")[0],
  };
}

module.exports = { computeEligibility };