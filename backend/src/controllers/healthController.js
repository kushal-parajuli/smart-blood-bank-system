// src/controllers/healthController.js
//
// Confirms both Express AND the MySQL connection are alive.
// Same 503-for-dependency-down pattern used in the AI assistant's
// /api/health endpoint — "our server is fine but a dependency
// isn't" deserves a different status code than a real server error.

const { pool } = require("../config/db");

async function checkHealth(req, res) {
  try {
    await pool.query("SELECT 1");
    res.json({
      success: true,
      server: "up",
      database: "up",
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      server: "up",
      database: "down",
      message: "Database connection failed.",
    });
  }
}

module.exports = { checkHealth };