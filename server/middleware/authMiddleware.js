import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verify token
export const protect = async (req, res, next) => {
  // Accept token from multiple common locations for robustness in dev
  let token = null;
  // Authorization header: "Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // x-access-token header
  if (!token && req.headers['x-access-token']) token = req.headers['x-access-token'];
  // cookie (if sent by client)
  if (!token && req.cookies && req.cookies.token) token = req.cookies.token;
  // query param
  if (!token && req.query && req.query.token) token = req.query.token;

  if (!token) {
    console.warn('Auth: No token found on request to', req.originalUrl);
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    // If token is valid but user was deleted, reject the request
    if (!req.user) {
      console.warn('Auth: token valid but user not found for id', decoded.id);
      return res.status(401).json({ message: "User not found" });
    }
    next();
  } catch (error) {
    console.warn('Auth: token verification failed for request to', req.originalUrl, error.message);
    res.status(401).json({ message: "Token invalid" });
  }
};

// Role-based Access
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Defensive: ensure req.user exists before checking role
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    // Use optional chaining to avoid crashing if role missing
    if (!roles.includes(req.user?.role)) {
      console.warn('Auth: authorization failed, required roles:', roles, 'user role:', req.user?.role);
      return res.status(403).json({ message: "You do not have permission to perform this action" });
    }
    next();
  };
};

// Middleware for superadmin-only routes
export const verifySuperAdmin = [protect, authorize('superadmin')];
