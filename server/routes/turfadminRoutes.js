import express from "express";
import { getTurfAdminAnalytics, getTurfAdminDashboard } from "../controllers/turfadminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Turf admin analytics
// Turfadmin analytics (accept admin during migration)
router.get("/analytics", protect, authorize("turfadmin", "admin"), getTurfAdminAnalytics);

// Turfadmin dashboard
router.get("/dashboard", protect, authorize("turfadmin", "admin"), getTurfAdminDashboard);

export default router;
