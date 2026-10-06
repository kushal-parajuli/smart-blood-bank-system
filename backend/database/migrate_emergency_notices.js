// database/migrate_emergency_notices.js
// Migration script to create the emergency_blood_notices table

const { pool } = require("../src/config/db");

async function runMigration() {
  console.log("Running database migration for emergency_blood_notices...");

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS emergency_blood_notices (
        id INT PRIMARY KEY AUTO_INCREMENT,
        created_by_user_id INT NOT NULL,
        blood_bank_id INT NULL,
        blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
        quantity_required INT NOT NULL DEFAULT 1,
        quantity_unit VARCHAR(20) NOT NULL DEFAULT 'units',
        emergency_level ENUM('red', 'yellow', 'green') NOT NULL DEFAULT 'red',
        message TEXT NULL,
        published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        cancelled_at DATETIME NULL,
        status ENUM('active', 'cancelled', 'expired') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (blood_bank_id) REFERENCES blood_banks(id) ON DELETE CASCADE,
        INDEX idx_active_notices (status, emergency_level, expires_at),
        INDEX idx_bank_notices (blood_bank_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("✓ emergency_blood_notices table created / verified successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runMigration();
