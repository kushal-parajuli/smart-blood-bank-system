// src/routes/authRoutes.js
//
// Maps URLs to authController functions. No logic here — routes only wire
// paths to handlers (and middleware), matching the same principle used
// in the first-aid-ai project.

const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");

router.post("/register", asyncHandler(authController.register));
router.post("/login", asyncHandler(authController.login));
router.get("/profile", protect, asyncHandler(authController.getProfile));

module.exports = router;