import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children, role }) => {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" />;
  if (role) {
    // Normalize roles to lowercase for comparison
    const allowed = (Array.isArray(role) ? role : [role]).map(r => String(r).toLowerCase());
    const userRole = String(user.role || '').toLowerCase();
  // Only turfadmin and superadmin can access turfadmin pages
    if (!allowed.includes(userRole)) return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default ProtectedRoute;
