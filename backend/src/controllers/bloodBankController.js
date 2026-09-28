const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const userModel = require("../models/userModel");
const bloodBankModel = require("../models/bloodBankModel");
const generateJWT = require("../utils/generateJWT");
const { isValidPassword, PASSWORD_REQUIREMENTS_MESSAGE } = require("../utils/validators");

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

  if (!isValidPassword(password)) {
    return res.status(400).json({
      success: false,
      message: PASSWORD_REQUIREMENTS_MESSAGE,
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
  const images = await bloodBankModel.findImagesByBankId(bloodBank.id);
  res.status(200).json({ success: true, bloodBank: { ...bloodBank, images } });
}

/**
 * GET /api/blood-banks
 * PUBLIC. Plain list of all banks — used by the donor booking flow to
 * pick a bank to donate at. Includes primary location photo.
 */
async function listBanks(req, res) {
  const banks = await bloodBankModel.findAllBanks();
  res.status(200).json({ success: true, banks });
}

/**
 * POST /api/blood-banks/images
 * PROTECTED, role: blood_bank.
 * Uploads a new facility / location / logo image for the authenticated bank.
 */
async function uploadImage(req, res) {
  const bloodBank = await bloodBankModel.findBloodBankByUserId(req.user.id);
  if (!bloodBank) {
    return res.status(404).json({ success: false, message: "Blood bank profile not found." });
  }

  const files = req.files?.length ? req.files : (req.file ? [req.file] : []);
  if (!files.length) {
    return res.status(400).json({ success: false, message: "Please provide one or more image files to upload." });
  }

  const { imageType = "gallery", caption } = req.body;
  const validTypes = ["logo", "owner", "building", "gallery"];
  const finalType = validTypes.includes(imageType) ? imageType : "gallery";

  const insertedImages = [];
  for (const file of files) {
    const imageUrl = `/uploads/blood_banks/${file.filename}`;
    const imageId = await bloodBankModel.createBloodBankImage({
      bloodBankId: bloodBank.id,
      imageUrl,
      imageType: finalType,
      caption: caption ? caption.trim() : null,
    });
    insertedImages.push({
      id: imageId,
      blood_bank_id: bloodBank.id,
      image_url: imageUrl,
      image_type: finalType,
      caption: caption ? caption.trim() : null,
    });
  }

  const updatedImages = await bloodBankModel.findImagesByBankId(bloodBank.id);

  res.status(201).json({
    success: true,
    message: `${insertedImages.length} photo${insertedImages.length > 1 ? "s" : ""} uploaded successfully.`,
    image: insertedImages[0],
    uploaded: insertedImages,
    images: updatedImages,
  });
}

/**
 * GET /api/blood-banks/me/images
 * PROTECTED, role: blood_bank.
 * Fetches all photos uploaded by the authenticated blood bank.
 */
async function listMyImages(req, res) {
  const bloodBank = await bloodBankModel.findBloodBankByUserId(req.user.id);
  if (!bloodBank) {
    return res.status(404).json({ success: false, message: "Blood bank profile not found." });
  }

  const images = await bloodBankModel.findImagesByBankId(bloodBank.id);
  res.status(200).json({ success: true, images });
}

/**
 * DELETE /api/blood-banks/images/:id
 * PROTECTED, role: blood_bank.
 * Deletes an image with strict ownership check.
 */
async function deleteImage(req, res) {
  const bloodBank = await bloodBankModel.findBloodBankByUserId(req.user.id);
  if (!bloodBank) {
    return res.status(404).json({ success: false, message: "Blood bank profile not found." });
  }

  const imageId = Number(req.params.id);
  const image = await bloodBankModel.findImageById(imageId);

  if (!image) {
    return res.status(404).json({ success: false, message: "Image not found." });
  }

  // Strict ownership check
  if (image.blood_bank_id !== bloodBank.id) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to delete photos from another blood bank facility.",
    });
  }

  // Delete file from disk if local upload
  try {
    const relativePath = image.image_url.replace(/^\//, "");
    const filePath = path.join(__dirname, "../../", relativePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn("Could not delete image file from disk:", err.message);
  }

  await bloodBankModel.deleteImageById(imageId);
  const updatedImages = await bloodBankModel.findImagesByBankId(bloodBank.id);

  res.status(200).json({
    success: true,
    message: "Photo deleted successfully.",
    images: updatedImages,
  });
}

/**
 * GET /api/blood-banks/:id/images
 * PUBLIC. Returns public gallery photos for a given blood bank.
 */
async function getBankImages(req, res) {
  const bankId = Number(req.params.id);
  const images = await bloodBankModel.findImagesByBankId(bankId);
  res.status(200).json({ success: true, images });
}

module.exports = {
  register,
  getMyProfile,
  listBanks,
  uploadImage,
  listMyImages,
  deleteImage,
  getBankImages,
};