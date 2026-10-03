// src/controllers/authController.js
//
// Handles HTTP request/response shape and validation for authentication.
// No SQL here — delegates all DB work to userModel. No JWT signing logic
// here either — delegates to utils/generateJWT.

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");
const bloodBankModel = require("../models/bloodBankModel");
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

  // Blood bank facilities require explicit administrator verification before accessing the system
  if (user.role === "blood_bank") {
    const bank = await bloodBankModel.findBloodBankByUserId(user.id);
    if (!bank || !bank.is_verified_by_admin || bank.verification_status !== "approved") {
      if (bank && bank.verification_status === "rejected") {
        const reasonText = bank.rejection_reason ? ` Reason: ${bank.rejection_reason}` : "";
        return res.status(403).json({
          success: false,
          message: `Your blood bank application was reviewed and rejected by an administrator.${reasonText}`,
        });
      }
      return res.status(403).json({
        success: false,
        message: "Your blood bank registration is currently pending administrator verification and approval. Please wait for approval before logging in.",
      });
    }
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
      profile_picture_url: user.profile_picture_url,
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
 * PROTECTED, any role. Updates name/phone/email.
 */
async function updateProfile(req, res) {
  const { name, phone, email } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "Name is required." });
  }

  const currentUser = await userModel.findUserById(req.user.id);
  if (!currentUser) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  let newEmail = currentUser.email;
  if (email && email.trim().toLowerCase() !== currentUser.email.toLowerCase()) {
    const existing = await userModel.findUserByEmail(email.trim().toLowerCase());
    if (existing && existing.id !== req.user.id) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }
    newEmail = email.trim().toLowerCase();
  }

  await userModel.updateUser(req.user.id, {
    name: name.trim(),
    phone: phone ? phone.trim() : null,
    email: newEmail,
  });
  const updated = await userModel.findUserById(req.user.id);

  res.status(200).json({ success: true, message: "Profile updated successfully.", user: updated });
}

/**
 * PUT /api/auth/password
 * PROTECTED, any role. Changes the user's password after verifying the current password.
 */
async function changePassword(req, res) {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Both current password and new password are required.",
    });
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "New password and password confirmation do not match.",
    });
  }

  if (!isValidPassword(newPassword)) {
    return res.status(400).json({
      success: false,
      message: PASSWORD_REQUIREMENTS_MESSAGE,
    });
  }

  const passwordHash = await userModel.getPasswordHashById(req.user.id);
  if (!passwordHash) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const matches = await bcrypt.compare(currentPassword, passwordHash);
  if (!matches) {
    return res.status(401).json({
      success: false,
      message: "The current password you entered is incorrect.",
    });
  }

  const isSame = await bcrypt.compare(newPassword, passwordHash);
  if (isSame) {
    return res.status(400).json({
      success: false,
      message: "New password cannot be the same as your current password.",
    });
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await userModel.updatePassword(req.user.id, newHash);

  res.status(200).json({
    success: true,
    message: "Password changed successfully.",
  });
}

/**
 * POST /api/auth/profile/picture
 * PROTECTED. Uploads or replaces the user's profile picture.
 */
async function uploadProfilePicture(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Please provide an image file to upload." });
  }

  const currentUser = await userModel.findUserById(req.user.id);
  if (currentUser?.profile_picture_url) {
    try {
      const oldRelativePath = currentUser.profile_picture_url.replace(/^\//, "");
      const oldFilePath = path.join(__dirname, "../../", oldRelativePath);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    } catch (e) {
      console.warn("Could not delete previous avatar file:", e.message);
    }
  }

  const imageUrl = `/uploads/avatars/${req.file.filename}`;
  await userModel.updateProfilePicture(req.user.id, imageUrl);
  const updated = await userModel.findUserById(req.user.id);

  res.status(200).json({
    success: true,
    message: "Profile picture updated successfully.",
    user: updated,
  });
}

/**
 * DELETE /api/auth/profile/picture
 * PROTECTED. Removes the user's profile picture.
 */
async function removeProfilePicture(req, res) {
  const currentUser = await userModel.findUserById(req.user.id);
  if (!currentUser) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  if (currentUser.profile_picture_url) {
    try {
      const oldRelativePath = currentUser.profile_picture_url.replace(/^\//, "");
      const oldFilePath = path.join(__dirname, "../../", oldRelativePath);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    } catch (e) {
      console.warn("Could not delete avatar file:", e.message);
    }
  }

  await userModel.updateProfilePicture(req.user.id, null);
  const updated = await userModel.findUserById(req.user.id);

  res.status(200).json({
    success: true,
    message: "Profile picture removed successfully.",
    user: updated,
  });
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  uploadProfilePicture,
  removeProfilePicture,
};