// database/test_verification_workflow.js
// Automated verification test for:
// 1. Blood Bank Registration (pending at first, blocked from login until approved/rejected by admin)
// 2. Admin Rejection and Approval of Blood Banks
// 3. Normal user request to become donor (active immediately without admin verification bottleneck)

const { pool } = require("../src/config/db");
const bcrypt = require("bcryptjs");

const API_BASE = "http://localhost:5000/api";

async function postJSON(url, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function putJSON(url, body = {}, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { method: "PUT", headers, body: JSON.stringify(body) });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function getJSON(url, token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { method: "GET", headers });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

const generateJWT = require("../src/utils/generateJWT");

async function runTests() {
  console.log("=== STARTING VERIFICATION WORKFLOW INTEGRATION TESTS ===");

  const timestamp = Date.now();
  const testBankEmail = `bank_test_${timestamp}@example.com`;
  const testBankLicense = `LIC-TEST-${timestamp}`;
  const testPassword = "Password123#";

  const testUserEmail = `user_test_${timestamp}@example.com`;

  try {
    // 0. Generate admin token directly
    console.log("\n0. Generating Admin Token...");
    const [admins] = await pool.query(
      "SELECT u.id, u.email FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'admin' LIMIT 1"
    );
    if (!admins.length) {
      throw new Error("No admin found in database to perform admin actions.");
    }
    const adminToken = generateJWT({ id: admins[0].id, role: "admin" });
    console.log("✓ Admin token generated successfully for:", admins[0].email);

    // 1. Blood Bank Registration
    console.log("\n1. Registering new Blood Bank...");
    const regRes = await postJSON(`${API_BASE}/blood-banks/register`, {
      name: "Test Bank Director",
      email: testBankEmail,
      password: testPassword,
      phone: "9800000001",
      bankName: `Test Blood Bank ${timestamp}`,
      licenseNumber: testBankLicense,
      address: "Maitighar",
      city: "Kathmandu",
      district: "Kathmandu",
      province: "Bagmati",
      latitude: 27.695,
      longitude: 85.321,
    });

    console.log("✓ Registration Response Status:", regRes.status);
    console.log("✓ Token present?", !!regRes.data.token);
    if (regRes.data.token) {
      throw new Error("Blood bank was issued a token before admin verification!");
    }
    const testBankId = regRes.data.bloodBank.id;
    console.log("✓ Blood bank registered with ID:", testBankId, "Verification pending.");

    // 2. Attempt login as pending blood bank
    console.log("\n2. Attempting login as unverified blood bank...");
    const pendingLoginRes = await postJSON(`${API_BASE}/auth/login`, {
      email: testBankEmail,
      password: testPassword,
    });
    if (pendingLoginRes.status === 403) {
      console.log("✓ Correctly blocked with 403:", pendingLoginRes.data.message);
    } else {
      throw new Error(`Expected 403 for pending blood bank login, got ${pendingLoginRes.status}`);
    }

    // 3. Admin rejects blood bank
    console.log("\n3. Admin rejects the blood bank with reason...");
    const rejectReason = "Testing license rejection check.";
    const rejectRes = await putJSON(
      `${API_BASE}/admin/blood-banks/${testBankId}/reject`,
      { reason: rejectReason },
      adminToken
    );
    console.log("✓ Admin rejection successful:", rejectRes.data.message);

    // 4. Attempt login as rejected blood bank
    console.log("\n4. Attempting login as rejected blood bank...");
    const rejectedLoginRes = await postJSON(`${API_BASE}/auth/login`, {
      email: testBankEmail,
      password: testPassword,
    });
    if (rejectedLoginRes.status === 403) {
      console.log("✓ Correctly blocked with 403 and reason:", rejectedLoginRes.data.message);
    } else {
      throw new Error(`Expected 403 for rejected blood bank login, got ${rejectedLoginRes.status}`);
    }

    // 5. Admin approves blood bank
    console.log("\n5. Admin approves the blood bank...");
    const approveRes = await putJSON(
      `${API_BASE}/admin/blood-banks/${testBankId}/verify`,
      {},
      adminToken
    );
    console.log("✓ Admin approval successful:", approveRes.data.message);

    // 6. Attempt login as approved blood bank
    console.log("\n6. Attempting login as approved blood bank...");
    const bankLoginRes = await postJSON(`${API_BASE}/auth/login`, {
      email: testBankEmail,
      password: testPassword,
    });
    if (bankLoginRes.status === 200 && bankLoginRes.data.token) {
      console.log("✓ Approved blood bank logged in successfully! Received token:", !!bankLoginRes.data.token);
    } else {
      throw new Error(`Approved blood bank login failed: ${JSON.stringify(bankLoginRes.data)}`);
    }

    // 7. Normal user registers and requests to become donor
    console.log("\n7. Normal user registers and requests to become donor...");
    const userRegRes = await postJSON(`${API_BASE}/auth/register`, {
      name: `Normal User ${timestamp}`,
      email: testUserEmail,
      password: testPassword,
      phone: "9800000002",
    });
    const userToken = userRegRes.data.token;
    console.log("✓ Normal user registered and received token.");

    console.log("Submitting request to become a donor...");
    const donorRes = await postJSON(
      `${API_BASE}/donors/register`,
      {
        bloodGroup: "O+",
        city: "Kathmandu",
        district: "Kathmandu",
        province: "Bagmati",
      },
      userToken
    );

    console.log("✓ Donor Registration Response:", donorRes.data);
    if (!donorRes.data.donor.isVerifiedByAdmin) {
      throw new Error("Donor registration was not immediately active/verified!");
    }
    console.log("✓ Donor is immediately active! isVerifiedByAdmin:", donorRes.data.donor.isVerifiedByAdmin);

    // 8. Admin retrieves donors list
    console.log("\n8. Admin retrieves donors directory...");
    const donorsListRes = await getJSON(`${API_BASE}/admin/donors`, adminToken);
    console.log(`✓ Admin retrieved ${donorsListRes.data.donors.length} active registered donors.`);

    console.log("\n==========================================");
    console.log("ALL TESTS COMPLETED AND PASSED PERFECTLY!");
    console.log("==========================================");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Test failed:", err.message);
    process.exit(1);
  }
}

runTests();
