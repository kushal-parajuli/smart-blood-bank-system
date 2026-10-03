// database/migrate_verification.js
// Migration script for blood bank verification status and donor auto-verification

const { pool } = require("../src/config/db");

async function runMigration() {
  console.log("Running migration for blood bank verification and donor status...");

  try {
    // 1. Check blood_banks columns
    const [bankCols] = await pool.query("DESCRIBE blood_banks");
    const hasStatus = bankCols.some((col) => col.Field === "verification_status");
    const hasReason = bankCols.some((col) => col.Field === "rejection_reason");

    if (!hasStatus) {
      console.log("Adding verification_status to blood_banks table...");
      await pool.query(
        "ALTER TABLE blood_banks ADD COLUMN verification_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' AFTER is_verified_by_admin"
      );
      console.log("✓ Added verification_status to blood_banks.");
    } else {
      console.log("✓ verification_status already exists in blood_banks.");
    }

    if (!hasReason) {
      console.log("Adding rejection_reason to blood_banks table...");
      await pool.query(
        "ALTER TABLE blood_banks ADD COLUMN rejection_reason TEXT NULL AFTER verification_status"
      );
      console.log("✓ Added rejection_reason to blood_banks.");
    } else {
      console.log("✓ rejection_reason already exists in blood_banks.");
    }

    // Update existing banks verification_status based on is_verified_by_admin
    await pool.query(
      "UPDATE blood_banks SET verification_status = 'approved' WHERE is_verified_by_admin = 1"
    );
    await pool.query(
      "UPDATE blood_banks SET verification_status = 'pending' WHERE is_verified_by_admin = 0 AND (verification_status IS NULL OR verification_status = 'pending')"
    );
    console.log("✓ Updated existing blood_banks verification_status.");

    // 2. Set default for donors to is_verified_by_admin = 1 and update existing donors
    console.log("Updating donors table so voluntary donors are active immediately...");
    await pool.query(
      "ALTER TABLE donors MODIFY COLUMN is_verified_by_admin BOOLEAN DEFAULT TRUE"
    );
    await pool.query("UPDATE donors SET is_verified_by_admin = 1 WHERE is_verified_by_admin = 0");
    console.log("✓ All donors updated to active status and default set to TRUE.");

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runMigration();
