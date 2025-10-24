import express from 'express';
import Booking from '../models/Booking.js';
import Turf from '../models/Turf.js';
import User from '../models/User.js';

const router = express.Router();

// Dev-only: return a small sample of bookings so frontend can display real data while debugging
// NOTE: This route is intentionally unprotected to make it easy to view sample data during local dev.
// Do NOT enable this in production.
router.get('/bookings-sample', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') return res.status(404).json({ message: 'Not found' });
    const bookings = await Booking.find({}).limit(100)
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('turf', 'name location')
      .lean();

    res.json(bookings.map(b => ({
      _id: b._id,
      user: b.user || null,
      turf: b.turf || null,
      date: b.date,
      status: b.status,
      price: b.price,
      slots: b.slots,
      createdAt: b.createdAt,
      payment: b.payment || null,
    })));
  } catch (e) {
    console.error('debugRoutes.bookings-sample failed', e?.message || e);
    res.status(500).json({ message: 'Failed to fetch sample bookings' });
  }
});

export default router;
