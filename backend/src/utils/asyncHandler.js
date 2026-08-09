// src/utils/asyncHandler.js
//
// Wraps an async controller function so any rejected promise (thrown error,
// failed DB query, etc.) is automatically passed to Express's error-handling
// middleware via next(err) — without writing try/catch in every controller.
//
// Usage:
//   router.post("/register", asyncHandler(authController.register));
//
// Without this, an unhandled rejection inside an async route handler would
// crash the request silently (Express 4 doesn't catch async errors on its own).

function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;