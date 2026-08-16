// src/utils/timeSlots.js
//
// Mirrors backend/src/utils/constants.js's BOOKING_START_HOUR/END_HOUR/
// SLOT_INTERVAL_MINUTES. Kept as a separate definition (frontend and
// backend are different codebases/runtimes) rather than a shared import —
// same pattern already used for BLOOD_GROUPS existing in both places.

export const BOOKING_START_HOUR = 10; // 10:00 AM
export const BOOKING_END_HOUR = 17;   // 5:00 PM
export const SLOT_INTERVAL_MINUTES = 15;

/** Returns ["10:00", "10:15", ..., "17:00"] */
export function generateTimeSlots() {
  const slots = [];
  for (let hour = BOOKING_START_HOUR; hour <= BOOKING_END_HOUR; hour++) {
    const maxMinute = hour === BOOKING_END_HOUR ? 0 : 60 - SLOT_INTERVAL_MINUTES;
    for (let minute = 0; minute <= maxMinute; minute += SLOT_INTERVAL_MINUTES) {
      slots.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
  }
  return slots;
}

/** "14:30" -> "2:30 PM" */
export function formatSlotLabel(slot) {
  const [h, m] = slot.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${String(m).padStart(2, "0")} ${period}`;
}

/** Today's date as "YYYY-MM-DD", for a date input's `min` attribute */
export function todayDateString() {
  return new Date().toISOString().split("T")[0];
}