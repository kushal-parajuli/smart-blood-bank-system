// src/middlewares/authMiddleware.js
//
// `protect` verifies the JWT sent in the Authorization header and attaches
// the decoded payload to req.user, so every downstream controller/middleware
// can trust req.user.id and req.user.role without re-verifying anything.
//
// Expected header format:  Authorization: Bearer <token>

const jwt = require("jsonwebtoken");

function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. No token provided.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. Token is invalid or expired.",
    });
  }
}

module.exports = { protect };