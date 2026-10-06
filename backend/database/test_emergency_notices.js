// database/test_emergency_notices.js
// Automated verification test for the Emergency Blood Notice System

const { pool } = require("../src/config/db");
const generateJWT = require("../src/utils/generateJWT");

const API_BASE = "http://localhost:5000/api";

async function postJSON(url, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function patchJSON(url, body = {}, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { method: "PATCH", headers, body: JSON.stringify(body) });
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

async function runTests() {
  console.log("=== STARTING EMERGENCY BLOOD NOTICES INTEGRATION TESTS ===\n");

  try {
    // 1. Get an admin user
    const [admins] = await pool.query(
      "SELECT u.id, u.email FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'admin' LIMIT 1"
    );
    if (!admins.length) throw new Error("No admin account found.");
    const adminToken = generateJWT({ id: admins[0].id, role: "admin" });
    console.log("✓ Admin user loaded:", admins[0].email);

    // 2. Get or find a verified blood bank
    const [banks] = await pool.query(
      `SELECT bb.id, bb.bank_name, bb.user_id, u.email
       FROM blood_banks bb
       JOIN users u ON bb.user_id = u.id
       WHERE bb.verification_status = 'approved' OR bb.is_verified_by_admin = 1
       LIMIT 1`
    );
    if (!banks.length) throw new Error("No verified blood bank found in database.");
    const bankToken = generateJWT({ id: banks[0].user_id, role: "blood_bank" });
    console.log(`✓ Verified blood bank loaded: "${banks[0].bank_name}" (bank_id: ${banks[0].id})`);

    // 3. Get a normal user
    const [users] = await pool.query(
      "SELECT u.id, u.email FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'user' LIMIT 1"
    );
    if (!users.length) throw new Error("No normal user found in database.");
    const userToken = generateJWT({ id: users[0].id, role: "user" });
    console.log("✓ Normal user loaded:", users[0].email);

    // TEST A: Check initial active notices
    console.log("\n--- TEST A: GET /api/emergency-notices/active ---");
    const initActiveRes = await getJSON(`${API_BASE}/emergency-notices/active`);
    if (!initActiveRes.ok) throw new Error(`Initial active fetch failed: ${JSON.stringify(initActiveRes)}`);
    console.log(`✓ Active notices endpoint responsive. Current active count: ${initActiveRes.data.count}`);

    // TEST B: Normal user attempts to create notice (MUST FAIL 403)
    console.log("\n--- TEST B: Normal User cannot publish notices ---");
    const userCreateRes = await postJSON(
      `${API_BASE}/emergency-notices`,
      {
        bloodGroup: "O+",
        quantityRequired: 2,
        emergencyLevel: "red",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      },
      userToken
    );
    if (userCreateRes.status !== 403) {
      throw new Error(`Expected 403 for user notice creation, got ${userCreateRes.status}: ${JSON.stringify(userCreateRes.data)}`);
    }
    console.log("✓ Normal user correctly blocked with 403 Forbidden.");

    // TEST C: Validation checks (invalid blood group, negative qty, expired time)
    console.log("\n--- TEST C: Validation constraints ---");
    const invalidGroupRes = await postJSON(
      `${API_BASE}/emergency-notices`,
      {
        bloodGroup: "INVALID",
        quantityRequired: 2,
        emergencyLevel: "red",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      },
      adminToken
    );
    if (invalidGroupRes.status !== 400) throw new Error("Expected 400 for invalid blood group.");
    console.log("✓ Invalid blood group correctly rejected (400).");

    const invalidQtyRes = await postJSON(
      `${API_BASE}/emergency-notices`,
      {
        bloodGroup: "A+",
        quantityRequired: -5,
        emergencyLevel: "red",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      },
      adminToken
    );
    if (invalidQtyRes.status !== 400) throw new Error("Expected 400 for negative quantity.");
    console.log("✓ Negative quantity correctly rejected (400).");

    const pastExpiryRes = await postJSON(
      `${API_BASE}/emergency-notices`,
      {
        bloodGroup: "A+",
        quantityRequired: 3,
        emergencyLevel: "red",
        expiresAt: new Date(Date.now() - 60000).toISOString(), // 1 minute in the past
      },
      adminToken
    );
    if (pastExpiryRes.status !== 400) throw new Error("Expected 400 for past expiration date.");
    console.log("✓ Past expiration date correctly rejected (400).");

    // TEST D: Clean slate for testing ordering — remove previous active test notices
    await pool.query("DELETE FROM emergency_blood_notices WHERE message LIKE 'TEST_%'");

    // TEST E: Create multiple notices to test strict priority ordering
    // Priority must be: Red > Yellow > Green, then newest first within same level!
    console.log("\n--- TEST E: Priority and Date Ordering ---");
    // Notice 1: Green (older)
    const g1Res = await postJSON(
      `${API_BASE}/emergency-notices`,
      {
        bloodGroup: "A+",
        quantityRequired: 2,
        emergencyLevel: "green",
        expiresAt: new Date(Date.now() + 7200000).toISOString(),
        message: "TEST_G1_Green_Older",
      },
      adminToken
    );
    const g1Id = g1Res.data.notice.id;

    // Wait 100ms
    await new Promise((r) => setTimeout(r, 100));

    // Notice 2: Red (older)
    const r1Res = await postJSON(
      `${API_BASE}/emergency-notices`,
      {
        bloodGroup: "B+",
        quantityRequired: 4,
        emergencyLevel: "red",
        expiresAt: new Date(Date.now() + 7200000).toISOString(),
        message: "TEST_R1_Red_Older",
      },
      bankToken
    );
    const r1Id = r1Res.data.notice.id;

    // Notice 3: Yellow (only)
    const y1Res = await postJSON(
      `${API_BASE}/emergency-notices`,
      {
        bloodGroup: "AB+",
        quantityRequired: 3,
        emergencyLevel: "yellow",
        expiresAt: new Date(Date.now() + 7200000).toISOString(),
        message: "TEST_Y1_Yellow",
      },
      adminToken
    );
    const y1Id = y1Res.data.notice.id;

    // Notice 4: Red (newer)
    const r2Res = await postJSON(
      `${API_BASE}/emergency-notices`,
      {
        bloodGroup: "O-",
        quantityRequired: 1,
        emergencyLevel: "red",
        expiresAt: new Date(Date.now() + 7200000).toISOString(),
        message: "TEST_R2_Red_Newer",
      },
      adminToken
    );
    const r2Id = r2Res.data.notice.id;

    // Notice 5: Green (newer)
    const g2Res = await postJSON(
      `${API_BASE}/emergency-notices`,
      {
        bloodGroup: "O+",
        quantityRequired: 5,
        emergencyLevel: "green",
        expiresAt: new Date(Date.now() + 7200000).toISOString(),
        message: "TEST_G2_Green_Newer",
      },
      adminToken
    );
    const g2Id = g2Res.data.notice.id;

    // Verify ordering from /active
    const orderedActiveRes = await getJSON(`${API_BASE}/emergency-notices/active`);
    const activeTestNotices = orderedActiveRes.data.notices.filter((n) =>
      n.message?.startsWith("TEST_")
    );

    console.log("Retrieved test notices in order:");
    activeTestNotices.forEach((n) => {
      console.log(`  - ID: ${n.id} | Level: ${n.emergency_level} | Message: ${n.message}`);
    });

    const expectedOrder = [r2Id, r1Id, y1Id, g2Id, g1Id];
    const actualOrder = activeTestNotices.map((n) => n.id);

    if (JSON.stringify(actualOrder) !== JSON.stringify(expectedOrder)) {
      throw new Error(`Ordering mismatch! Expected: ${JSON.stringify(expectedOrder)}, got: ${JSON.stringify(actualOrder)}`);
    }
    console.log("✓ Strict priority ordering verified: Red(newer) > Red(older) > Yellow > Green(newer) > Green(older)!");

    // TEST F: Blood bank cancellation ownership check
    console.log("\n--- TEST F: Authorization & Ownership on Cancellation ---");
    // Blood bank attempts to cancel Notice 4 (created by admin, not owned by bank)
    const unauthorizedCancelRes = await patchJSON(
      `${API_BASE}/emergency-notices/${r2Id}/cancel`,
      {},
      bankToken
    );
    if (unauthorizedCancelRes.status !== 403) {
      throw new Error(`Expected 403 when bank attempts to cancel another's notice, got ${unauthorizedCancelRes.status}`);
    }
    console.log("✓ Blood bank blocked (403) from cancelling another creator's notice.");

    // Blood bank cancels their own notice (Notice 2 - r1Id)
    const ownCancelRes = await patchJSON(
      `${API_BASE}/emergency-notices/${r1Id}/cancel`,
      {},
      bankToken
    );
    if (!ownCancelRes.ok) throw new Error(`Bank cancelling own notice failed: ${JSON.stringify(ownCancelRes)}`);
    console.log("✓ Blood bank successfully cancelled their own notice.");

    // Verify it is no longer returned in /active
    const afterCancelActiveRes = await getJSON(`${API_BASE}/emergency-notices/active`);
    const stillPresent = afterCancelActiveRes.data.notices.some((n) => n.id === r1Id);
    if (stillPresent) throw new Error("Cancelled notice still appears in active notices feed!");
    console.log("✓ Cancelled notice immediately omitted from /active feed.");

    // Admin cancels Notice 4 (r2Id)
    const adminCancelRes = await patchJSON(
      `${API_BASE}/emergency-notices/${r2Id}/cancel`,
      {},
      adminToken
    );
    if (!adminCancelRes.ok) throw new Error(`Admin cancel failed: ${JSON.stringify(adminCancelRes)}`);
    console.log("✓ Admin successfully cancelled notice.");

    // Clean up test notices
    await pool.query("DELETE FROM emergency_blood_notices WHERE message LIKE 'TEST_%'");
    console.log("✓ Test records cleaned up.");

    console.log("\n=== ALL EMERGENCY NOTICE BACKEND TESTS PASSED SUCCESSFULLY! ===");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Test execution failed:", err);
    process.exit(1);
  }
}

runTests();
