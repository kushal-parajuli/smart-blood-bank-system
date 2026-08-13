// src/routes/donationRoutes.js

const express = require("express");
const router = express.Router();

const donationController = require("../controllers/donationController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");

router.get("/me", protect, authorize("user"), asyncHandler(donationController.getMyDonations));

module.exports = router;