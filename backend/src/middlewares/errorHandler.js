// src/middlewares/errorHandler.js
//
// Catches anything passed to next(err) — including errors forwarded by
// asyncHandler — and returns a consistent JSON error shape instead of
// Express's default HTML error page. Must be registered LAST in app.js,
// after all routes, per Express convention (4-arg signature is what
// tells Express this is an error handler, not regular middleware).

function errorHandler(err, req, res, next) {
  console.error(err.stack);

  // MySQL duplicate-entry errors (e.g. UNIQUE constraint) — surface a
  // clean message instead of a raw SQL error leaking to the client.
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists.",
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Something went wrong on the server.",
  });
}

module.exports = errorHandler;