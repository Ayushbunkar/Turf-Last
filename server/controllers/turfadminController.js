import Booking from '../models/Booking.js';
import Turf from '../models/Turf.js';
import User from '../models/User.js';

// Turf Admin Analytics
export async function getTurfAdminAnalytics(req, res) {
	try {
		// Ensure authenticated
		if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
		// Only fetch analytics for turfs managed by this admin
		const adminId = req.user?._id;
		const turfs = await Turf.find({ admin: adminId });
		const turfIds = turfs.map(t => t._id);
		// Bookings for these turfs
		const bookings = await Booking.find({ turf: { $in: turfIds } });
		const totalRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
		const totalBookings = bookings.length;
		// Monthly revenue
		const now = new Date();
		const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const monthlyRevenue = bookings.filter(b => b.createdAt >= firstDayOfMonth).reduce((sum, b) => sum + (b.price || 0), 0);
		// Chart data: revenue per week (last 4 weeks)
		const chartData = [];
		for (let i = 0; i < 4; i++) {
			const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - i * 7);
			const weekEnd = new Date(weekStart);
			weekEnd.setDate(weekStart.getDate() + 6);
			const weekBookings = bookings.filter(b => b.createdAt >= weekStart && b.createdAt <= weekEnd);
			const weekRevenue = weekBookings.reduce((sum, b) => sum + (b.price || 0), 0);
			chartData.unshift({ week: `Week ${4 - i}`, revenue: weekRevenue, bookings: weekBookings.length });
		}
		res.json({
			analytics: {
				totalRevenue,
				monthlyRevenue,
				totalBookings,
				turfCount: turfs.length
			},
			charts: {
				revenueChart: chartData
			}
		});
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch turf admin analytics', details: err.message });
	}
}

// Turf Admin Dashboard
export async function getTurfAdminDashboard(req, res) {
	try {
		if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
		const adminId = req.user?._id;
		const turfs = await Turf.find({ admin: adminId });
		res.json({ turfs });
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch turf admin dashboard', details: err.message });
	}
}
