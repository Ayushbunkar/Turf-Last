import express from "express";
import {
  getTotalBookings,
  getTotalRevenue,
  getTurfBookings,
  getDailyRevenue,
} from "../controllers/analyticsController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// SuperAdmin only
router.get("/total-bookings", protect, authorize("superadmin"), getTotalBookings);
router.get("/total-revenue", protect, authorize("superadmin"), getTotalRevenue);
router.get("/turf-bookings", protect, authorize("superadmin"), getTurfBookings);
router.get("/daily-revenue", protect, authorize("superadmin"), getDailyRevenue);

export default router;
