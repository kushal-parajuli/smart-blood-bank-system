// src/controllers/bloodBankController.js

const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const userModel = require("../models/userModel");
const bloodBankModel = require("../models/bloodBankModel");
const generateJWT = require("../utils/generateJWT");

const SALT_ROUNDS = 10;

/**
 * POST /api/blood-banks/register
 * Public registration for a blood bank account. Creates BOTH a `users` row
 * (role = 'blood_bank') and a `blood_banks` profile row.
 *
 * Why a transaction: these two inserts must succeed or fail together.
 * Without a transaction, if the users insert succeeds but the blood_banks
 * insert then fails (e.g. duplicate license number), we'd be left with an
 * orphaned user account — a login-capable account with no bank profile.
 * A transaction guarantees: either both rows exist, or neither does.
 *
 * Note on trust: is_verified_by_admin defaults to FALSE (see schema).
 * Registering does NOT immediately make a bank publicly visible/trusted —
 * that requires admin verification, built as its own future module. This
 * endpoint just creates the account; verification is a separate gate.
 */
async function register(req, res) {
  const {
    name, email, password, phone,           // account/contact fields
    bankName, licenseNumber,                 // bank identity
    address, city, district, province,       // location (typed)
    latitude, longitude,                     // location (map-picked, optional)
  } = req.body;

  // --- Validation ---
  if (!name || !email || !password || !bankName || !licenseNumber) {
    return res.status(400).json({
      success: false,
      message: "Name, email, password, bank name, and license number are required.",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long.",
    });
  }

  if (latitude != null && (latitude < -90 || latitude > 90)) {
    return res.status(400).json({ success: false, message: "Invalid latitude value." });
  }
  if (longitude != null && (longitude < -180 || longitude > 180)) {
    return res.status(400).json({ success: false, message: "Invalid longitude value." });
  }

  const existingEmail = await userModel.findUserByEmail(email);
  if (existingEmail) {
    return res.status(409).json({ success: false, message: "An account with this email already exists." });
  }

  const existingLicense = await bloodBankModel.findByLicenseNumber(licenseNumber);
  if (existingLicense) {
    return res.status(409).json({ success: false, message: "This license number is already registered." });
  }

  // --- Transaction: create users row + blood_banks row together ---
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const roleId = await userModel.getRoleIdByName("blood_bank", connection);
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const userId = await userModel.createUser(
      { name, email, passwordHash, phone, roleId },
      connection
    );

    const bloodBankId = await bloodBankModel.createBloodBank(
      { userId, bankName, licenseNumber, address, city, district, province, latitude, longitude },
      connection
    );

    await connection.commit();

    const token = generateJWT({ id: userId, role: "blood_bank" });

    res.status(201).json({
      success: true,
      message: "Blood bank registered successfully. Verification by an administrator is pending.",
      token,
      user: { id: userId, name, email, role: "blood_bank" },
      bloodBank: { id: bloodBankId, bankName, licenseNumber, isVerifiedByAdmin: false },
    });
  } catch (err) {
    await connection.rollback();
    throw err; // forwarded to errorHandler via asyncHandler
  } finally {
    connection.release();
  }
}

/**
 * GET /api/blood-banks/me
 * Protected — returns the logged-in blood bank's own profile.
 * Used by the bank's dashboard once frontend auth is wired up.
 */
async function getMyProfile(req, res) {
  const bloodBank = await bloodBankModel.findBloodBankByUserId(req.user.id);
  if (!bloodBank) {
    return res.status(404).json({ success: false, message: "Blood bank profile not found." });
  }
  res.status(200).json({ success: true, bloodBank });
}

module.exports = { register, getMyProfile };