// src/routes/emergencyNoticeRoutes.js
//
// Route definitions for emergency blood notice broadcast and management.

const express = require("express");
const router = express.Router();

const emergencyNoticeController = require("../controllers/emergencyNoticeController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");

// 1. Global active notices banner feed (Public & Authenticated)
router.get("/active", asyncHandler(emergencyNoticeController.getActiveNotices));

// 2. Management list for Admin & Blood Bank dashboards
router.get(
  "/",
  protect,
  authorize("admin", "blood_bank"),
  asyncHandler(emergencyNoticeController.listNotices)
);

// 3. Publish emergency notice (Admin & Blood Bank only)
router.post(
  "/",
  protect,
  authorize("admin", "blood_bank"),
  asyncHandler(emergencyNoticeController.createNotice)
);

// 4. Specific notice detail
router.get("/:id", asyncHandler(emergencyNoticeController.getNoticeById));

// 5. Cancel active emergency notice (Admin & Blood Bank owner)
router.patch(
  "/:id/cancel",
  protect,
  authorize("admin", "blood_bank"),
  asyncHandler(emergencyNoticeController.cancelNotice)
);

module.exports = router;
