// src/middlewares/uploadMiddleware.js
// Centralized multer upload configuration for avatars and blood bank photos.

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const UPLOAD_ROOT = path.join(__dirname, "../../uploads");
const AVATARS_DIR = path.join(UPLOAD_ROOT, "avatars");
const BLOOD_BANKS_DIR = path.join(UPLOAD_ROOT, "blood_banks");

// Ensure upload directories exist
[UPLOAD_ROOT, AVATARS_DIR, BLOOD_BANKS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function fileFilter(req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error("Invalid file type. Only JPEG, PNG, and WebP images are allowed.");
    error.statusCode = 400;
    cb(error, false);
  }
}

// Storage for user profile avatars
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, AVATARS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-user-${req.user?.id || "anon"}-${uniqueSuffix}${ext}`);
  },
});

// Storage for blood bank location/facility photos
const bankStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, BLOOD_BANKS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `bank-${req.user?.id || "anon"}-${uniqueSuffix}${ext}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

const uploadBankImage = multer({
  storage: bankStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

module.exports = {
  uploadAvatar,
  uploadBankImage,
  UPLOAD_ROOT,
};
