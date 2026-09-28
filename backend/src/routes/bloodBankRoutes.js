const express = require("express");
const router = express.Router();

const bloodBankController = require("../controllers/bloodBankController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const { uploadBankImage } = require("../middlewares/uploadMiddleware");
const asyncHandler = require("../utils/asyncHandler");

router.post("/register", asyncHandler(bloodBankController.register));

router.get("/", asyncHandler(bloodBankController.listBanks));

router.get(
  "/me",
  protect,
  authorize("blood_bank"),
  asyncHandler(bloodBankController.getMyProfile)
);

// Bank Image Management routes
router.post(
  "/images",
  protect,
  authorize("blood_bank"),
  uploadBankImage.any(),
  asyncHandler(bloodBankController.uploadImage)
);

router.get(
  "/me/images",
  protect,
  authorize("blood_bank"),
  asyncHandler(bloodBankController.listMyImages)
);

router.delete(
  "/images/:id",
  protect,
  authorize("blood_bank"),
  asyncHandler(bloodBankController.deleteImage)
);

// Public route to view bank's gallery/location photos
router.get("/:id/images", asyncHandler(bloodBankController.getBankImages));

module.exports = router;