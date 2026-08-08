// src/config/db.js
//
// Centralized MySQL connection pool.
// This is the ONLY file that should configure the raw DB connection.
// Every other file (models, services) should import `pool` from here
// rather than creating its own connection — keeps DB config in one place,
// same principle you already used for Ollama config in the AI assistant.

const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Quick connectivity check, called once at server startup (see server.js).
// Fails loudly and early if XAMPP's MySQL isn't running or credentials
// are wrong, rather than letting the first real request fail confusingly.
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("MySQL connected successfully.");
    connection.release();
  } catch (err) {
    console.error("MySQL connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };