import express from "express";
import {
  getTotalBookings,
  getTotalRevenue,
  getTurfBookings,
  getDailyRevenue,
} from "../controllers/analyticsController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Accessible by superadmin and turfadmin (turfadmin will receive scoped results)
router.get("/total-bookings", protect, authorize("superadmin", "turfadmin"), getTotalBookings);
router.get("/total-revenue", protect, authorize("superadmin", "turfadmin"), getTotalRevenue);
router.get("/turf-bookings", protect, authorize("superadmin", "turfadmin"), getTurfBookings);
router.get("/daily-revenue", protect, authorize("superadmin", "turfadmin"), getDailyRevenue);

export default router;
