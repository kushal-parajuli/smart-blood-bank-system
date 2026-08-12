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
const authRoutes = require("./routes/authRoutes");
const bloodBankRoutes = require("./routes/bloodBankRoutes");
const donorRoutes = require("./routes/donorRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const requestRoutes = require("./routes/requestRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const adminRoutes = require("./routes/adminRoutes");

const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

// Public route — basic server + DB health check
app.use("/api/health", healthRoutes);

// Auth — register/login are public; /profile is protected internally via middleware
app.use("/api/auth", authRoutes);

// Blood banks — /register is public; other routes are protected internally
app.use("/api/blood-banks", bloodBankRoutes);

// Donors — donor is a profile a logged-in user opts into, not a public signup
app.use("/api/donors", donorRoutes);

// Inventory — /search is public; add/update/delete are blood_bank-only
app.use("/api/inventory", inventoryRoutes);

// Blood requests — all routes protected, split between user-side and bank-side
app.use("/api/requests", requestRoutes);

// Donor appointments — booking, bank confirmation, and the donor-fallback/nudge feature
app.use("/api/appointments", appointmentRoutes);

// Admin — every route here requires role: admin (enforced once, at router level)
app.use("/api/admin", adminRoutes);

// AI First Aid proxy route intentionally NOT added yet —
// AI integration is the last phase per project plan.
// app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Smart Blood Bank Management System API is running." });
});

// Must be registered LAST — after all routes — so it can catch errors
// forwarded via next(err) from anywhere above it.
app.use(errorHandler);

module.exports = app;