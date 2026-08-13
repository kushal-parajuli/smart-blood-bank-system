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

module.exports = {
  VALID_BLOOD_GROUPS,
  DONATION_ELIGIBILITY_INTERVAL_DAYS,
  MINIMUM_DONATION_WEIGHT_KG,
};