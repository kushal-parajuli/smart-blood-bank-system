// src/utils/constants.js
//
// Shared constants used across multiple modules. Blood groups are needed
// by donors, inventory, and blood requests alike — defining the list once
// here avoids three separate copies quietly drifting out of sync.

const VALID_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// General guideline only — the actual eligibility gap between whole-blood
// donations varies by authority and by individual health, and the real
// decision always belongs to the blood bank's medical staff, not this
// system. This is shown to the person as a rough estimate, never as a
// medical determination — same principle as the AI First Aid Assistant
// never claiming to replace a doctor.
const DONATION_ELIGIBILITY_INTERVAL_DAYS = 90;

// Commonly cited general minimum for whole-blood donation eligibility.
// Used only to show a soft, informational flag — never to block someone
// from booking. The blood bank's own screening at the appointment is
// the real gate, not this system.
const MINIMUM_DONATION_WEIGHT_KG = 45;

// Donation appointments are only bookable within office hours, on
// 15-minute slots — matches how the blood bank actually schedules staff
// for donor screening, not a 24-hour self-service window.
const BOOKING_START_HOUR = 10; // 10:00 AM
const BOOKING_END_HOUR = 17;   // 5:00 PM — last bookable slot is exactly 17:00
const SLOT_INTERVAL_MINUTES = 15;

/**
 * @param {Date} dateObj
 * @returns {boolean} true if dateObj's time-of-day falls on a valid
 *   office-hours slot (ignores the date portion — caller checks that separately)
 */
function isValidBookingSlot(dateObj) {
  const hour = dateObj.getHours();
  const minute = dateObj.getMinutes();
  if (minute % SLOT_INTERVAL_MINUTES !== 0) return false;
  if (hour < BOOKING_START_HOUR || hour > BOOKING_END_HOUR) return false;
  if (hour === BOOKING_END_HOUR && minute !== 0) return false; // 17:00 only, not 17:15+
  return true;
}

module.exports = {
  VALID_BLOOD_GROUPS,
  DONATION_ELIGIBILITY_INTERVAL_DAYS,
  MINIMUM_DONATION_WEIGHT_KG,
  BOOKING_START_HOUR,
  BOOKING_END_HOUR,
  SLOT_INTERVAL_MINUTES,
  isValidBookingSlot,
};