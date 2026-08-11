// src/routes/appointmentRoutes.js

const express = require("express");
const router = express.Router();

const appointmentController = require("../controllers/appointmentController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");

// --- Donor-side ---
router.post("/", protect, authorize("user"), asyncHandler(appointmentController.bookAppointment));
router.get("/me", protect, authorize("user"), asyncHandler(appointmentController.getMyAppointments));
router.patch("/:id/cancel", protect, authorize("user"), asyncHandler(appointmentController.cancelAppointment));

// --- Bank-side ---
router.get("/bank", protect, authorize("blood_bank"), asyncHandler(appointmentController.getBankAppointments));
router.put("/:id/complete", protect, authorize("blood_bank"), asyncHandler(appointmentController.markAsCompleted));
router.put("/:id/missed", protect, authorize("blood_bank"), asyncHandler(appointmentController.markAsMissed));

// --- Donor-fallback (any logged-in user, since it's part of the request flow) ---
router.get(
  "/fallback-donor",
  protect,
  asyncHandler(appointmentController.getFallbackDonors)
);
router.post(
  "/:id/nudge",
  protect,
  authorize("user"),
  asyncHandler(appointmentController.nudgeDonor)
);

module.exports = router;