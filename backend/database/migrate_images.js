// database/migrate_images.js
// Migration script to add profile_picture_url to users and create blood_bank_images table

const { pool } = require("../src/config/db");

async function runMigration() {
  console.log("Running database migrations for profile pictures and blood bank images...");

  try {
    // 1. Add profile_picture_url to users if it doesn't already exist
    const [userCols] = await pool.query("DESCRIBE users");
    const hasProfilePicture = userCols.some((col) => col.Field === "profile_picture_url");

    if (!hasProfilePicture) {
      console.log("Adding profile_picture_url column to users table...");
      await pool.query(
        "ALTER TABLE users ADD COLUMN profile_picture_url VARCHAR(255) NULL AFTER phone"
      );
      console.log("✓ Added profile_picture_url to users table.");
    } else {
      console.log("✓ profile_picture_url already exists in users table.");
    }

    // 2. Create blood_bank_images table if it doesn't exist
    console.log("Creating blood_bank_images table if not exists...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blood_bank_images (
        id INT PRIMARY KEY AUTO_INCREMENT,
        blood_bank_id INT NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        image_type ENUM('logo', 'owner', 'building', 'gallery') NOT NULL DEFAULT 'gallery',
        caption VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (blood_bank_id) REFERENCES blood_banks(id) ON DELETE CASCADE,
        INDEX idx_bank_images (blood_bank_id, image_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✓ blood_bank_images table ready.");

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runMigration();
