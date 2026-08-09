// src/routes/inventoryRoutes.js

const express = require("express");
const router = express.Router();

const inventoryController = require("../controllers/inventoryController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");

// PUBLIC — anyone (logged in or not) can search blood availability.
// Placed before the protected routes for readability; Express doesn't
// care about order between different HTTP methods/paths like this.
router.get("/search", asyncHandler(inventoryController.searchAvailability));

// PROTECTED, blood_bank only, from here down.
router.post("/", protect, authorize("blood_bank"), asyncHandler(inventoryController.addBatch));
router.get("/me", protect, authorize("blood_bank"), asyncHandler(inventoryController.getMyInventory));
router.put("/:id", protect, authorize("blood_bank"), asyncHandler(inventoryController.updateBatch));
router.delete("/:id", protect, authorize("blood_bank"), asyncHandler(inventoryController.removeBatch));

module.exports = router;