// src/routes/notificationRoutes.js

const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationController");
const { protect } = require("../middlewares/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");

router.get("/me", protect, asyncHandler(notificationController.getMyNotifications));
router.patch("/:id/read", protect, asyncHandler(notificationController.markAsRead));
router.patch("/read-all", protect, asyncHandler(notificationController.markAllAsRead));

module.exports = router;