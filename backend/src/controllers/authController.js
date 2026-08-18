// src/controllers/authController.js
//
// Handles HTTP request/response shape and validation for authentication.
// No SQL here — delegates all DB work to userModel. No JWT signing logic
// here either — delegates to utils/generateJWT.

const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");
const generateJWT = require("../utils/generateJWT");
const { isValidPassword, PASSWORD_REQUIREMENTS_MESSAGE } = require("../utils/validators");

const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * Public registration. Deliberately only ever creates role = 'user'.
 *
 * Why: 'blood_bank' accounts need extra required fields (bank_name,
 * license_number, address) and admin approval before they're trusted —
 * that's a separate flow we'll build as its own module (bloodBankController),
 * which will create the users row AND the blood_banks row together.
 * 'admin' accounts should never be self-registered through a public
 * endpoint at all. Keeping this endpoint single-purpose avoids a security
 * hole where anyone could POST role: "admin" and grant themselves access.
 */
async function register(req, res) {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and password are required.",
    });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({
      success: false,
      message: PASSWORD_REQUIREMENTS_MESSAGE,
    });
  }

  const existing = await userModel.findUserByEmail(email);
  if (existing) {
    return res.status(409).json({
      success: false,
      message: "An account with this email already exists.",
    });
  }

  const roleId = await userModel.getRoleIdByName("user");
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const userId = await userModel.createUser({
    name,
    email,
    passwordHash,
    phone,
    roleId,
  });

  const token = generateJWT({ id: userId, role: "user" });

  res.status(201).json({
    success: true,
    message: "Registration successful.",
    token,
    user: { id: userId, name, email, role: "user" },
  });
}

/**
 * POST /api/auth/login
 * Works for all roles (user, blood_bank, admin) — the role is read from
 * the DB, not the request body, so a login request can't claim a role
 * it doesn't have.
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required.",
    });
  }

  const user = await userModel.findUserByEmail(email);
  if (!user) {
    // Deliberately the same message as a wrong password (below) — confirming
    // "this email doesn't exist" to an attacker is a minor info leak worth avoiding.
    return res.status(401).json({ success: false, message: "Invalid email or password." });
  }

  if (user.is_suspended) {
    return res.status(403).json({
      success: false,
      message: "This account has been suspended. Contact an administrator.",
    });
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ success: false, message: "Invalid email or password." });
  }

  const token = generateJWT({ id: user.id, role: user.role });

  res.status(200).json({
    success: true,
    message: "Login successful.",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}

/**
 * GET /api/auth/profile
 * Protected route — requires a valid JWT (see authMiddleware.protect).
 * Simple example route that proves the auth pipeline works end-to-end;
 * also the pattern every future protected route will follow.
 */
async function getProfile(req, res) {
  const user = await userModel.findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  res.status(200).json({ success: true, user });
}

/**
 * PUT /api/auth/profile
 * PROTECTED, any role. Updates name/phone only — email, password, and
 * role all need their own separate, more carefully-guarded flows.
 */
async function updateProfile(req, res) {
  const { name, phone } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "Name is required." });
  }

  await userModel.updateUser(req.user.id, { name: name.trim(), phone });
  const updated = await userModel.findUserById(req.user.id);

  res.status(200).json({ success: true, message: "Profile updated.", user: updated });
}

module.exports = { register, login, getProfile, updateProfile };