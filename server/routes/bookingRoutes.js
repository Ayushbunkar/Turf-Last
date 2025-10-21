import express from "express";
import {
  createBooking,
  createBatchBooking,
  getMyBookings,
  getAdminBookings,
  updateBookingStatus,
  getBookingsForTurf,
  getBookingById,
  streamInvoice,
  getAllBookings,
  releasePendingBooking,
  getAuditLogs,
  cleanupPendingBookings,
} from "../controllers/bookingController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// User routes
router.post("/", protect, authorize("user"), createBooking);
// batch endpoint: create multiple pending bookings in one request
router.post('/batch', protect, authorize('user'), createBatchBooking);
router.get("/my-bookings", protect, authorize("user"), getMyBookings);
// Public: get bookings for a turf (optionally filter by date)
router.get("/turf/:turfId", getBookingsForTurf);

// Get booking by id (owner/admin)
router.get('/:id', protect, getBookingById);

// Stream invoice PDF for a booking
router.get('/:id/invoice', protect, streamInvoice);

// Admin routes
router.get("/admin", protect, authorize("admin"), getAdminBookings);
router.put("/:id/status", protect, authorize("admin", "superadmin"), updateBookingStatus);
// Admin release endpoint (cancel a pending booking to free a slot)
router.post("/:bookingId/release", protect, authorize("admin", "superadmin"), releasePendingBooking);

router.post('/cleanup-pending', protect, authorize('superadmin'), cleanupPendingBookings);
// Audit logs (admin)
router.get('/audit-logs', protect, authorize('admin', 'superadmin'), getAuditLogs);

// SuperAdmin routes
router.get("/all", protect, authorize("superadmin"), getAllBookings);

export default router;
