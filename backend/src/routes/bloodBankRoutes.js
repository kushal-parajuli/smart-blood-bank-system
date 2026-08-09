// src/routes/bloodBankRoutes.js

const express = require("express");
const router = express.Router();

const bloodBankController = require("../controllers/bloodBankController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");

router.post("/register", asyncHandler(bloodBankController.register));

router.get(
  "/me",
  protect,
  authorize("blood_bank"),
  asyncHandler(bloodBankController.getMyProfile)
);

module.exports = router;