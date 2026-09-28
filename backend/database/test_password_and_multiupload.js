// backend/database/test_password_and_multiupload.js
// Automated verification for:
// 1. Multi-photo blood bank upload (multiple photos at once)
// 2. Password change API (validation, verification, update, and login)
// 3. User & Admin profile update (name, email, phone)

const API_BASE = "http://localhost:5000/api";

const SAMPLE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const sampleBuffer = Buffer.from(SAMPLE_PNG_BASE64, "base64");

async function run() {
  console.log("=== STARTING MULTI-PHOTO & PASSWORD INTEGRATION TESTS ===");
  const timestamp = Date.now();

  // ==========================================
  // TEST 1: Password Change API
  // ==========================================
  console.log("\n1. Testing User Registration & Password Change...");
  const userEmail = `pw_test_${timestamp}@example.com`;
  const initialPassword = "Password123!";
  const newPassword = "NewPassword456#";

  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Password Test User",
      email: userEmail,
      password: initialPassword,
      phone: "9800000000",
    }),
  });
  const regData = await regRes.json();
  if (!regData.success) throw new Error("Registration failed: " + JSON.stringify(regData));
  const token = regData.token;
  console.log("✓ User registered. Token received.");

  // Test 1a: Attempt password change with incorrect current password
  console.log("\n1a. Verifying rejection of wrong current password...");
  const wrongRes = await fetch(`${API_BASE}/auth/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      currentPassword: "WrongCurrentPassword999!",
      newPassword,
      confirmPassword: newPassword,
    }),
  });
  const wrongData = await wrongRes.json();
  if (wrongRes.status !== 401 || wrongData.success) {
    throw new Error("Expected 401 for wrong current password, got: " + JSON.stringify(wrongData));
  }
  console.log("✓ Correctly rejected wrong current password with 401:", wrongData.message);

  // Test 1b: Attempt password change with weak password
  console.log("\n1b. Verifying rejection of weak new password...");
  const weakRes = await fetch(`${API_BASE}/auth/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      currentPassword: initialPassword,
      newPassword: "weak",
      confirmPassword: "weak",
    }),
  });
  const weakData = await weakRes.json();
  if (weakRes.status !== 400 || weakData.success) {
    throw new Error("Expected 400 for weak password, got: " + JSON.stringify(weakData));
  }
  console.log("✓ Correctly rejected weak password with 400:", weakData.message);

  // Test 1c: Successfully change password
  console.log("\n1c. Successfully changing password with valid credentials...");
  const changeRes = await fetch(`${API_BASE}/auth/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      currentPassword: initialPassword,
      newPassword,
      confirmPassword: newPassword,
    }),
  });
  const changeData = await changeRes.json();
  if (!changeData.success) {
    throw new Error("Failed to change password: " + JSON.stringify(changeData));
  }
  console.log("✓ Password changed successfully:", changeData.message);

  // Test 1d: Verify login with new password
  console.log("\n1d. Verifying login with newly changed password...");
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: userEmail,
      password: newPassword,
    }),
  });
  const loginData = await loginRes.json();
  if (!loginData.success) {
    throw new Error("Failed to login with new password: " + JSON.stringify(loginData));
  }
  console.log("✓ Successfully authenticated with new password! User ID:", loginData.user.id);

  // ==========================================
  // TEST 2: Profile Update (Name, Email, Phone)
  // ==========================================
  console.log("\n2. Testing Profile Update (Name, Email, Phone)...");
  const updatedEmail = `pw_updated_${timestamp}@example.com`;
  const updateRes = await fetch(`${API_BASE}/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${loginData.token}`,
    },
    body: JSON.stringify({
      name: "Kushal Parajuli (Administrator)",
      email: updatedEmail,
      phone: "9812345678",
    }),
  });
  const updateData = await updateRes.json();
  if (!updateData.success || updateData.user.name !== "Kushal Parajuli (Administrator)") {
    throw new Error("Profile update failed: " + JSON.stringify(updateData));
  }
  console.log("✓ Profile updated successfully:", updateData.user.name, updateData.user.email, updateData.user.phone);

  // ==========================================
  // TEST 3: Multi-Photo Upload for Blood Bank
  // ==========================================
  console.log("\n3. Testing Multiple Photos Upload for Blood Bank...");
  const bankEmail = `bank_multi_${timestamp}@example.com`;
  const bankRegRes = await fetch(`${API_BASE}/blood-banks/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Kathmandu Central Lab",
      email: bankEmail,
      password: "Password123!",
      phone: "01-4455667",
      bankName: "Kathmandu Central Blood Bank",
      licenseNumber: `BB-MULTI-${timestamp}`,
      address: "Maitighar, Kathmandu",
      city: "Kathmandu",
      district: "Kathmandu",
      province: "Bagmati",
      latitude: 27.693,
      longitude: 85.321,
    }),
  });
  const bankRegData = await bankRegRes.json();
  if (!bankRegData.success) {
    throw new Error("Bank registration failed: " + JSON.stringify(bankRegData));
  }
  const bankToken = bankRegData.token;
  console.log("✓ Blood bank registered.");

  // Create multipart form with 3 photos simultaneously
  console.log("\n3a. Uploading 3 photos simultaneously in a single request...");
  const formData = new FormData();
  formData.append(
    "images",
    new Blob([sampleBuffer], { type: "image/png" }),
    "building_front.png"
  );
  formData.append(
    "images",
    new Blob([sampleBuffer], { type: "image/png" }),
    "donation_hall.png"
  );
  formData.append(
    "images",
    new Blob([sampleBuffer], { type: "image/png" }),
    "reception_desk.png"
  );
  formData.append("imageType", "building");
  formData.append("caption", "Main facility exterior and interior halls");

  const multiUploadRes = await fetch(`${API_BASE}/blood-banks/images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${bankToken}` },
    body: formData,
  });
  const multiUploadData = await multiUploadRes.json();
  if (!multiUploadData.success || multiUploadData.images?.length !== 3) {
    throw new Error("Multi-upload failed: " + JSON.stringify(multiUploadData));
  }
  console.log("✓ Multi-upload succeeded! Server response:", multiUploadData.message);
  console.log("✓ Total photos now in bank gallery:", multiUploadData.images.length);
  multiUploadData.images.forEach((img, i) => {
    console.log(`  [${i + 1}] ID: ${img.id}, Type: ${img.image_type}, URL: ${img.image_url}`);
  });

  console.log("\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ===");
}

run().catch((err) => {
  console.error("\n❌ TEST FAILED:", err.message);
  process.exit(1);
});
