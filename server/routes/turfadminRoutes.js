import express from "express";
import { getTurfAdminAnalytics, getTurfAdminDashboard } from "../controllers/turfadminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Turf admin analytics
router.get("/analytics", protect, authorize("Turfadmin"), getTurfAdminAnalytics);

// Turf admin dashboard
router.get("/dashboard", protect, authorize("Turfadmin"), getTurfAdminDashboard);

export default router;
