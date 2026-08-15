// src/components/common/ProtectedRoute.jsx
//
// Wraps a page that requires login, and optionally a specific role.
// - No `roles` prop: just requires being logged in (any role).
// - `roles={["blood_bank"]}`: requires login AND that exact role —
//   a logged-in normal user hitting a bank-only route gets redirected
//   home, not shown a broken/empty dashboard meant for a different role.

import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return null; // avoid a flash-redirect while session is still restoring from localStorage

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}