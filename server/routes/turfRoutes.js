import express from "express";
import {
  createTurf,
  getAllTurfs,
  getMyTurfs,
  getTurfById,
  updateTurf,
  deleteTurf,
  approveTurf,
  blockTurf,
} from "../controllers/turfController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";


const router = express.Router();

// Public route
router.get("/", getAllTurfs);
router.get("/:id", getTurfById);

// Admin routes (admins can manage their own turfs)
router.post("/", protect, authorize("admin"), createTurf);
router.get("/my-turfs", protect, authorize("admin"), getMyTurfs);
// Allow superadmin to update/delete any turf; admins can update/delete their own
router.put("/:id", protect, (req, res, next) => {
  // allow admin or superadmin to hit updateTurf; controller will enforce ownership
  if (req.user?.role === 'admin' || req.user?.role === 'superadmin') return next();
  return res.status(403).json({ message: 'Not authorized' });
}, updateTurf);
router.delete("/:id", protect, (req, res, next) => {
  if (req.user?.role === 'admin' || req.user?.role === 'superadmin') return next();
  return res.status(403).json({ message: 'Not authorized' });
}, deleteTurf);

// SuperAdmin routes
router.patch("/:id/approve", protect, authorize("superadmin"), approveTurf);
router.patch("/:id/block", protect, authorize("superadmin"), blockTurf);

export default router;
