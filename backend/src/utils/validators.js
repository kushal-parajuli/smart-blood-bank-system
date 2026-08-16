// src/utils/validators.js
//
// Shared validation rules used across multiple controllers (auth,
// blood bank registration, and any future registration flow), so the
// password policy is defined once rather than copy-pasted and risking
// drift between endpoints.

// At least 8 characters, one uppercase, one lowercase, one digit, one
// special character. This is enforced here (backend) as the real
// source of truth — the frontend form also checks this for a good UX,
// but a client-side-only check can always be bypassed by anyone calling
// the API directly (e.g. via Postman), so the backend must never skip it.
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const PASSWORD_REQUIREMENTS_MESSAGE =
  "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.";

function isValidPassword(password) {
  return typeof password === "string" && PASSWORD_REGEX.test(password);
}

module.exports = { PASSWORD_REGEX, PASSWORD_REQUIREMENTS_MESSAGE, isValidPassword };