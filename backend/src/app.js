// src/app.js
//
// Express app configuration: middleware + route mounting.
// No server.listen() here on purpose — that lives in server.js.
// Separating "app definition" from "server startup" is a standard
// pattern that makes the app easier to test later (you can import
// `app` without actually starting a server).

const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/healthRoutes");
// Future route imports will be added here as modules are built, e.g.:
// const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Public route — basic server + DB health check
app.use("/api/health", healthRoutes);

// Future route mounts:
// app.use("/api/auth", authRoutes);
// app.use("/api/donors", donorRoutes);
// app.use("/api/blood-banks", bloodBankRoutes);
// app.use("/api/requests", requestRoutes);
// app.use("/api/admin", adminRoutes);
//
// AI First Aid proxy route intentionally NOT added yet —
// AI integration is the last phase per project plan.
// app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Smart Blood Bank Management System API is running." });
});

module.exports = app;