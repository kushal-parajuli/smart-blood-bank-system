// tests/e2e_images_test.js
// Comprehensive automated test verifying user profile pictures and blood bank location photos

const fs = require("fs");
const path = require("path");

const API_BASE = "http://localhost:5000/api";
const SERVER_BASE = "http://localhost:5000";

// Simple 1x1 PNG pixel as test image
const SAMPLE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const sampleBuffer = Buffer.from(SAMPLE_PNG_BASE64, "base64");

async function runTests() {
  console.log("=== STARTING END-TO-END IMAGE INTEGRATION TESTS ===");

  const timestamp = Date.now();
  const testUserEmail = `img_user_${timestamp}@example.com`;
  const testBankEmail = `img_bank_${timestamp}@example.com`;
  const testPassword = "Password123!";

  // -------------------------------------------------------------
  // TEST 1: Register Normal User
  // -------------------------------------------------------------
  console.log("\n1. Registering new normal user...");
  const userRegRes = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Kushal Test User",
      email: testUserEmail,
      password: testPassword,
      phone: "9841123456",
    }),
  });
  const userRegData = await userRegRes.json();
  if (!userRegData.success) throw new Error("User registration failed: " + JSON.stringify(userRegData));
  const userToken = userRegData.token;
  console.log("✓ User registered successfully. ID:", userRegData.user.id);

  // -------------------------------------------------------------
  // TEST 2: Check Initial Profile (no picture)
  // -------------------------------------------------------------
  console.log("\n2. Checking initial profile...");
  const profRes = await fetch(`${API_BASE}/auth/profile`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const profData = await profRes.json();
  if (profData.user.profile_picture_url !== null) {
    throw new Error("Expected initial profile_picture_url to be null");
  }
  console.log("✓ Initial profile_picture_url is null (will render initial 'K' fallback).");

  // -------------------------------------------------------------
  // TEST 3: Upload Profile Picture
  // -------------------------------------------------------------
  console.log("\n3. Uploading profile picture...");
  const formData = new FormData();
  formData.append(
    "picture",
    new Blob([sampleBuffer], { type: "image/png" }),
    "profile.png"
  );

  const uploadRes = await fetch(`${API_BASE}/auth/profile/picture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${userToken}` },
    body: formData,
  });
  const uploadData = await uploadRes.json();
  if (!uploadData.success || !uploadData.user.profile_picture_url) {
    throw new Error("Profile picture upload failed: " + JSON.stringify(uploadData));
  }
  const uploadedUrl = uploadData.user.profile_picture_url;
  console.log("✓ Profile picture uploaded successfully. URL:", uploadedUrl);

  // -------------------------------------------------------------
  // TEST 4: Fetch Uploaded Static File from Server
  // -------------------------------------------------------------
  console.log("\n4. Verifying static file serving...");
  const fileRes = await fetch(`${SERVER_BASE}${uploadedUrl}`);
  if (fileRes.status !== 200) {
    throw new Error(`Failed to fetch uploaded image from server: HTTP ${fileRes.status}`);
  }
  console.log("✓ Uploaded image is statically accessible (HTTP 200).");

  // -------------------------------------------------------------
  // TEST 5: Verify Persistence in Profile Route
  // -------------------------------------------------------------
  console.log("\n5. Verifying profile persistence on refresh...");
  const profRes2 = await fetch(`${API_BASE}/auth/profile`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const profData2 = await profRes2.json();
  if (profData2.user.profile_picture_url !== uploadedUrl) {
    throw new Error("profile_picture_url did not persist");
  }
  console.log("✓ Profile picture persists across profile fetches.");

  // -------------------------------------------------------------
  // TEST 6: Delete Profile Picture
  // -------------------------------------------------------------
  console.log("\n6. Deleting profile picture...");
  const delRes = await fetch(`${API_BASE}/auth/profile/picture`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const delData = await delRes.json();
  if (!delData.success || delData.user.profile_picture_url !== null) {
    throw new Error("Failed to delete profile picture: " + JSON.stringify(delData));
  }
  console.log("✓ Profile picture removed, URL is now null (reverts to initial).");

  // -------------------------------------------------------------
  // TEST 7: Register Blood Bank
  // -------------------------------------------------------------
  console.log("\n7. Registering new Blood Bank...");
  const bankRegRes = await fetch(`${API_BASE}/blood-banks/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Dr. Sharma",
      email: testBankEmail,
      password: testPassword,
      phone: "9800000000",
      bankName: `Apex Life Blood Bank ${timestamp}`,
      licenseNumber: `LIC-${timestamp}`,
      address: "Tripureshwor Marg",
      city: "Kathmandu",
      district: "Kathmandu",
      province: "Bagmati",
      latitude: 27.7172,
      longitude: 85.324,
    }),
  });
  const bankRegData = await bankRegRes.json();
  if (!bankRegData.success) throw new Error("Bank registration failed: " + JSON.stringify(bankRegData));
  const bankToken = bankRegData.token;
  const bankId = bankRegData.bloodBank.id;
  console.log("✓ Blood Bank registered. Bank ID:", bankId);

  // -------------------------------------------------------------
  // TEST 8: Upload Location Photos (Building, Gallery, Logo)
  // -------------------------------------------------------------
  console.log("\n8. Uploading Blood Bank location photos...");

  // 8a. Building Exterior
  const formBuilding = new FormData();
  formBuilding.append(
    "image",
    new Blob([sampleBuffer], { type: "image/png" }),
    "building.png"
  );
  formBuilding.append("imageType", "building");
  formBuilding.append("caption", "Main Building Entrance on Ring Road");

  const upBuildRes = await fetch(`${API_BASE}/blood-banks/images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${bankToken}` },
    body: formBuilding,
  });
  const upBuildData = await upBuildRes.json();
  if (!upBuildData.success) throw new Error("Building upload failed: " + JSON.stringify(upBuildData));
  const buildingImgId = upBuildData.image.id;
  const buildingImgUrl = upBuildData.image.image_url;
  console.log("✓ Building exterior photo uploaded. ID:", buildingImgId, "URL:", buildingImgUrl);

  // 8b. Gallery / Interior
  const formGallery = new FormData();
  formGallery.append(
    "image",
    new Blob([sampleBuffer], { type: "image/png" }),
    "gallery.png"
  );
  formGallery.append("imageType", "gallery");
  formGallery.append("caption", "Donation Suite & Recovery Lounge");

  const upGalRes = await fetch(`${API_BASE}/blood-banks/images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${bankToken}` },
    body: formGallery,
  });
  const upGalData = await upGalRes.json();
  if (!upGalData.success) throw new Error("Gallery upload failed: " + JSON.stringify(upGalData));
  const galleryImgId = upGalData.image.id;
  console.log("✓ Gallery interior photo uploaded. ID:", galleryImgId);

  // -------------------------------------------------------------
  // TEST 9: List Blood Bank Images (Authenticated)
  // -------------------------------------------------------------
  console.log("\n9. Listing photos via GET /api/blood-banks/me/images...");
  const listRes = await fetch(`${API_BASE}/blood-banks/me/images`, {
    headers: { Authorization: `Bearer ${bankToken}` },
  });
  const listData = await listRes.json();
  if (listData.images.length !== 2) {
    throw new Error(`Expected 2 images, got ${listData.images.length}`);
  }
  console.log("✓ Authenticated bank can list all its images (total 2).");

  // -------------------------------------------------------------
  // TEST 10: Public Access to Bank Gallery
  // -------------------------------------------------------------
  console.log(`\n10. Fetching public gallery via GET /api/blood-banks/${bankId}/images...`);
  const pubGalRes = await fetch(`${API_BASE}/blood-banks/${bankId}/images`);
  const pubGalData = await pubGalRes.json();
  if (pubGalData.images.length !== 2) {
    throw new Error(`Expected 2 public images, got ${pubGalData.images.length}`);
  }
  console.log("✓ Public visitors can view the gallery without authentication.");

  // -------------------------------------------------------------
  // TEST 11: Public Bank List Includes Primary Image
  // -------------------------------------------------------------
  console.log("\n11. Verifying public GET /api/blood-banks contains primary_image_url...");
  const allBanksRes = await fetch(`${API_BASE}/blood-banks`);
  const allBanksData = await allBanksRes.json();
  const foundBank = allBanksData.banks.find((b) => b.id === bankId);
  if (!foundBank || foundBank.primary_image_url !== buildingImgUrl) {
    throw new Error(
      `Expected foundBank.primary_image_url to equal buildingImgUrl (${buildingImgUrl}), got ${foundBank?.primary_image_url}`
    );
  }
  console.log("✓ Public blood-banks directory returns primary_image_url for card rendering:", foundBank.primary_image_url);

  // -------------------------------------------------------------
  // TEST 12: Delete One Photo as Bank
  // -------------------------------------------------------------
  console.log(`\n12. Deleting gallery photo ${galleryImgId}...`);
  const delImgRes = await fetch(`${API_BASE}/blood-banks/images/${galleryImgId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${bankToken}` },
  });
  const delImgData = await delImgRes.json();
  if (!delImgData.success || delImgData.images.length !== 1) {
    throw new Error("Delete image failed: " + JSON.stringify(delImgData));
  }
  console.log("✓ Photo deleted successfully. Remaining photos: 1 (building exterior intact).");

  // -------------------------------------------------------------
  // TEST 13: Ownership Check — Bank cannot delete another bank's photo
  // -------------------------------------------------------------
  console.log("\n13. Testing ownership security check (cross-facility deletion)...");
  // Register bank 2
  const bank2RegRes = await fetch(`${API_BASE}/blood-banks/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Dr. Pokharel",
      email: `other_bank_${timestamp}@example.com`,
      password: testPassword,
      phone: "9800000001",
      bankName: `Second Blood Bank ${timestamp}`,
      licenseNumber: `LIC-OTHER-${timestamp}`,
      address: "Pokhara Marg",
      city: "Pokhara",
      district: "Kaski",
      province: "Gandaki",
    }),
  });
  const bank2RegData = await bank2RegRes.json();
  const bank2Token = bank2RegData.token;

  // Bank 2 tries to delete Bank 1's building photo
  const unauthorizedDelRes = await fetch(`${API_BASE}/blood-banks/images/${buildingImgId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${bank2Token}` },
  });
  if (unauthorizedDelRes.status !== 403) {
    throw new Error(`Expected HTTP 403 Forbidden for cross-bank deletion, got ${unauthorizedDelRes.status}`);
  }
  console.log("✓ Security verified: Bank B was blocked with HTTP 403 from deleting Bank A's image.");

  console.log("\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ===");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
