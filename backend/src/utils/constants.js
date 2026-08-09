// src/utils/constants.js
//
// Shared constants used across multiple modules. Blood groups are needed
// by donors, inventory, and blood requests alike — defining the list once
// here avoids three separate copies quietly drifting out of sync.

const VALID_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

module.exports = { VALID_BLOOD_GROUPS };