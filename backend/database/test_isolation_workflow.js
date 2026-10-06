// database/test_isolation_workflow.js
// Verification of strict isolation between normal user Blood Requests and Emergency Blood Notices

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

async function getJSON(url, token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { method: "GET", headers });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function runIsolationTest() {
  console.log("=== STARTING BLOOD REQUEST VS EMERGENCY NOTICE ISOLATION TEST ===\n");

  try {
    // 1. Fetch normal user and verified blood bank
    const [users] = await pool.query(
      "SELECT u.id, u.email FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'user' LIMIT 1"
    );
    if (!users.length) throw new Error("No normal user found.");
    const userToken = generateJWT({ id: users[0].id, role: "user" });
    console.log("✓ Normal user loaded:", users[0].email);

    const [banks] = await pool.query(
      `SELECT bb.id, bb.bank_name, bb.user_id, u.email
       FROM blood_banks bb
       JOIN users u ON bb.user_id = u.id
       WHERE bb.verification_status = 'approved' OR bb.is_verified_by_admin = 1
       LIMIT 1`
    );
    if (!banks.length) throw new Error("No verified blood bank found.");
    const bankToken = generateJWT({ id: banks[0].user_id, role: "blood_bank" });
    console.log(`✓ Blood bank loaded: "${banks[0].bank_name}" (user_id: ${banks[0].user_id})`);

    // Clean up any test records
    await pool.query("DELETE FROM blood_requests WHERE notes LIKE 'TEST_USER_REQ_%'");
    await pool.query("DELETE FROM emergency_blood_notices WHERE message LIKE 'TEST_BANK_NOTICE_%'");

    // 2. Normal user creates a Blood Request
    console.log("\nStep 1: Normal user creates a Blood Request...");
    const userReqRes = await postJSON(
      `${API_BASE}/requests`,
      {
        bloodGroup: "AB-",
        unitsNeeded: 3,
        urgency: "urgent",
        notes: "TEST_USER_REQ_Patient urgently requires AB- blood for surgery",
      },
      userToken
    );
    if (!userReqRes.ok) {
      throw new Error(`Failed to create user blood request: ${JSON.stringify(userReqRes.data)}`);
    }
    const userRequestId = userReqRes.data.request?.id;
    console.log(`✓ Normal user blood request created successfully with ID: ${userRequestId}`);

    // 3. Verify user request appears in user's own request list
    const myRequestsRes = await getJSON(`${API_BASE}/requests/me`, userToken);
    const hasMyReq = myRequestsRes.data.requests?.some((r) => r.id === userRequestId);
    if (!hasMyReq) throw new Error("User request not found in user's request history!");
    console.log("✓ User request confirmed present in normal blood_requests workflow.");

    // 4. CRITICAL CHECK: Verify the user request NEVER appears in Emergency Notices!
    console.log("\nStep 2: Checking Emergency Notices active feed for user request...");
    const activeNoticesRes1 = await getJSON(`${API_BASE}/emergency-notices/active`);
    if (!activeNoticesRes1.ok) throw new Error("Failed to fetch active emergency notices.");

    const leakedUserReq = activeNoticesRes1.data.notices?.some(
      (n) =>
        n.message?.includes("TEST_USER_REQ") ||
        (n.blood_group === "AB-" && n.quantity_required === 3)
    );
    if (leakedUserReq) {
      throw new Error("❌ FAILURE: Normal user blood request leaked into Emergency Blood Notices!");
    }
    console.log("✓ VERIFIED: Normal user blood request does NOT appear in Emergency Notices!");

    // 5. Blood bank manually creates an Emergency Blood Notice
    console.log("\nStep 3: Blood bank intentionally publishes an Emergency Blood Notice...");
    const bankNoticeRes = await postJSON(
      `${API_BASE}/emergency-notices`,
      {
        bloodGroup: "O+",
        quantityRequired: 5,
        emergencyLevel: "red",
        expiresAt: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        message: "TEST_BANK_NOTICE_Kathmandu Blood Bank needs help from another blood bank for 5 units O+",
      },
      bankToken
    );
    if (!bankNoticeRes.ok) {
      throw new Error(`Blood bank failed to publish emergency notice: ${JSON.stringify(bankNoticeRes.data)}`);
    }
    const noticeId = bankNoticeRes.data.notice.id;
    console.log(`✓ Emergency Notice published with ID: ${noticeId}`);

    // 6. Verify that ONLY the manual blood bank emergency notice appears in active notices
    console.log("\nStep 4: Checking Emergency Notices active feed again...");
    const activeNoticesRes2 = await getJSON(`${API_BASE}/emergency-notices/active`);
    const foundNotice = activeNoticesRes2.data.notices?.find((n) => n.id === noticeId);
    if (!foundNotice) {
      throw new Error("Emergency notice not found in active feed!");
    }
    console.log(`✓ Confirmed manual notice is active: [${foundNotice.emergency_level.toUpperCase()}] ${foundNotice.blood_group} - ${foundNotice.quantity_required} units (${foundNotice.bank_name})`);

    // Ensure user request is STILL not in emergency notices
    const userReqStillMissing = !activeNoticesRes2.data.notices?.some((n) =>
      n.message?.includes("TEST_USER_REQ")
    );
    if (!userReqStillMissing) {
      throw new Error("❌ User request appeared in emergency notices feed!");
    }
    console.log("✓ VERIFIED: Active feed contains ONLY valid manual notices, zero user blood requests.");

    // 7. Cleanup test records
    await pool.query("DELETE FROM blood_requests WHERE notes LIKE 'TEST_USER_REQ_%'");
    await pool.query("DELETE FROM emergency_blood_notices WHERE message LIKE 'TEST_BANK_NOTICE_%'");
    console.log("\n✓ Test records cleaned up successfully.");

    console.log("\n=== ALL ISOLATION TESTS PASSED: STRICT SEPARATION CONFIRMED! ===");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Isolation test failed:", err);
    process.exit(1);
  }
}

runIsolationTest();
