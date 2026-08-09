// src/utils/generateJWT.js
//
// Single source of truth for how tokens are created, so the signing logic
// (payload shape, secret, expiry) only exists in one place. Every other
// file just calls generateJWT(user) rather than calling jwt.sign() directly.

const jwt = require("jsonwebtoken");

/**
 * @param {{ id: number, role: string }} user - minimal identity to embed in the token.
 *   Deliberately NOT including name/email/etc. — the token is an identity+role
 *   credential, not a data cache. Anything else needed should be fetched fresh
 *   from the DB using the id, so a change to a user's profile doesn't require
 *   them to re-login for it to take effect.
 * @returns {string} signed JWT
 */
function generateJWT(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

module.exports = generateJWT;