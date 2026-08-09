// src/middlewares/roleMiddleware.js
//
// `authorize(...allowedRoles)` restricts a route to specific roles.
// Must be used AFTER authMiddleware.protect, since it depends on req.user
// already being set.
//
// Usage example (future inventory route):
//   router.put(
//     "/:id",
//     protect,
//     authorize("blood_bank"),
//     inventoryController.updateStock
//   );

function authorize(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
    }
    next();
  };
}

module.exports = { authorize };