// src/server.js
//
// Entry point. Loads env vars, verifies DB connectivity, then starts
// the HTTP server. Keep startup logic here, not in app.js.

require("dotenv").config();
const app = require("./app");
const { testConnection } = require("./config/db");

const PORT = process.env.PORT || 5000;

async function startServer() {
  await testConnection();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();