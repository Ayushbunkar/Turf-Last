import Booking from "../models/Booking.js";
import Turf from "../models/Turf.js";
import User from "../models/User.js";

// Total bookings
export const getTotalBookings = async (req, res) => {
  try {
    // If turfadmin, scope to turfs managed by this user
    if (req.user && req.user.role === 'turfadmin') {
      const turfs = await Turf.find({ admin: req.user._id }).select('_id');
      const turfIds = turfs.map(t => t._id);
      const count = turfIds.length ? await Booking.countDocuments({ turf: { $in: turfIds } }) : 0;
      return res.json({ totalBookings: count });
    }

    const count = await Booking.countDocuments();
    res.json({ totalBookings: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Total revenue (only paid bookings)
export const getTotalRevenue = async (req, res) => {
  try {
    // If turfadmin, scope to their turfs
    if (req.user && req.user.role === 'turfadmin') {
      const turfs = await Turf.find({ admin: req.user._id }).select('_id');
      const turfIds = turfs.map(t => t._id);
      if (!turfIds.length) return res.json({ totalRevenue: 0 });
      const paidBookings = await Booking.find({ status: "paid", turf: { $in: turfIds } });
      const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.price || b.amount || 0), 0);
      return res.json({ totalRevenue });
    }

    const paidBookings = await Booking.find({ status: "paid" });
    const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.price || b.amount || 0), 0);
    res.json({ totalRevenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Turf-wise bookings
export const getTurfBookings = async (req, res) => {
  try {
    let turfs = [];
    // If turfadmin, only return their turfs
    if (req.user && req.user.role === 'turfadmin') {
      turfs = await Turf.find({ admin: req.user._id });
    } else {
      turfs = await Turf.find();
    }

    const data = [];
    for (let turf of turfs) {
      const count = await Booking.countDocuments({ turf: turf._id });
      data.push({ turf: turf.name, bookings: count });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Daily revenue (last 7 days)
export const getDailyRevenue = async (req, res) => {
  try {
    const today = new Date();
    const pastWeek = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();

    const revenueData = [];

    // If turfadmin, limit bookings to their turfs
    let turfIds = null;
    if (req.user && req.user.role === 'turfadmin') {
      const turfs = await Turf.find({ admin: req.user._id }).select('_id');
      turfIds = turfs.map(t => t._id);
    }

    for (let date of pastWeek) {
      const q = { date, status: "paid" };
      if (turfIds) q.turf = { $in: turfIds };
      const bookings = await Booking.find(q);
      const total = bookings.reduce((sum, b) => sum + (b.price || b.amount || 0), 0);
      revenueData.push({ date, revenue: total });
    }

    res.json(revenueData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
