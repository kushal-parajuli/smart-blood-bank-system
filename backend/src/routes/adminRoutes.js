// src/routes/adminRoutes.js
//
// Every single route here requires BOTH protect (valid JWT) AND
// authorize("admin") — applied once at the router level via router.use(),
// rather than repeating both middlewares on every individual line.
// This is deliberately stricter than other route files: there is no
// "public" or "any logged-in user" route anywhere in this file.

const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");

router.use(protect, authorize("admin"));

// --- Blood bank verification ---
router.get("/blood-banks/pending", asyncHandler(adminController.getUnverifiedBloodBanks));
router.put("/blood-banks/:id/verify", asyncHandler(adminController.verifyBloodBank));

// --- Donor verification ---
router.get("/donors/pending", asyncHandler(adminController.getUnverifiedDonors));
router.put("/donors/:id/verify", asyncHandler(adminController.verifyDonor));

// --- User management ---
router.get("/users", asyncHandler(adminController.getAllUsers));
router.put("/users/:id/suspend", asyncHandler(adminController.suspendUser));
router.put("/users/:id/unsuspend", asyncHandler(adminController.unsuspendUser));

// --- Dashboard stats ---
router.get("/stats", asyncHandler(adminController.getSystemStats));

module.exports = router;