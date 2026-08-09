// src/routes/donorRoutes.js

const express = require("express");
const router = express.Router();

const donorController = require("../controllers/donorController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");

// Both routes require login. authorize("user") because only normal-user
// accounts can hold a donor profile — a blood_bank or admin account
// registering as a donor wouldn't make sense in this system's model.
router.post(
  "/register",
  protect,
  authorize("user"),
  asyncHandler(donorController.registerAsDonor)
);

router.get(
  "/me",
  protect,
  authorize("user"),
  asyncHandler(donorController.getMyDonorProfile)
);

module.exports = router;