import Booking from "../models/Booking.js";
import Turf from "../models/Turf.js";
import User from "../models/User.js";

// Total bookings
export const getTotalBookings = async (req, res) => {
  try {
    const count = await Booking.countDocuments();
    res.json({ totalBookings: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Total revenue (only paid bookings)
export const getTotalRevenue = async (req, res) => {
  try {
    const paidBookings = await Booking.find({ status: "paid" });
    const totalRevenue = paidBookings.reduce((sum, b) => sum + b.price, 0);
    res.json({ totalRevenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Turf-wise bookings
export const getTurfBookings = async (req, res) => {
  try {
    const turfs = await Turf.find();
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

    for (let date of pastWeek) {
      const bookings = await Booking.find({ date, status: "paid" });
      const total = bookings.reduce((sum, b) => sum + b.price, 0);
      revenueData.push({ date, revenue: total });
    }

    res.json(revenueData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
