// src/routes/healthRoutes.js
//
// Routes ONLY map URL -> controller function. No logic here.

const express = require("express");
const router = express.Router();
const { checkHealth } = require("../controllers/healthController");

router.get("/", checkHealth);

module.exports = router;