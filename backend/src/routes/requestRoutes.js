// src/routes/requestRoutes.js

const express = require("express");
const router = express.Router();

const requestController = require("../controllers/requestController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");

// --- User-side ---
router.post("/", protect, authorize("user"), asyncHandler(requestController.createRequest));
router.get("/me", protect, authorize("user"), asyncHandler(requestController.getMyRequests));
router.patch("/:id/assign-bank", protect, authorize("user"), asyncHandler(requestController.assignBank));
router.patch("/:id/cancel", protect, authorize("user"), asyncHandler(requestController.cancelRequest));

// --- Blood-bank-side ---
router.get(
  "/bank/incoming",
  protect,
  authorize("blood_bank"),
  asyncHandler(requestController.getBankIncomingRequests)
);
router.put(
  "/:id/status",
  protect,
  authorize("blood_bank"),
  asyncHandler(requestController.updateRequestStatus)
);

module.exports = router;