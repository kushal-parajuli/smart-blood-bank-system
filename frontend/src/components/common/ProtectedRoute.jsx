// src/components/common/ProtectedRoute.jsx
//
// Wraps a page that requires login. If the person isn't authenticated,
// they're sent to /login instead of seeing the page. Used for anything
// that needs req.user on the backend — donor registration, booking,
// dashboards, etc.

import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null; // avoid a flash-redirect while session is still restoring from localStorage

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}