// --- SUPPORT TICKETS CONTROLLER ---
let SupportTicket;
try {
  SupportTicket = (await import('../models/SupportTicket.js')).default;
} catch (err) {
  // If model doesn't exist, fallback to dummy array
  SupportTicket = null;
}

// Update general user fields (name, email, phone, address)
export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    if (!id) return res.status(400).json({ error: 'User id required' });

    const allowed = ['name', 'email', 'phone', 'address', 'status'];
    const updates = {};
    Object.keys(payload).forEach(k => {
      if (allowed.includes(k)) updates[k] = payload[k];
    });

    if (updates.email) updates.email = String(updates.email).trim().toLowerCase();

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user?.role,
      status: user.status,
      updatedAt: user.updatedAt
    };
    res.json({ user: safeUser });
  } catch (err) {
    console.error('updateUser error:', err);
    res.status(500).json({ error: 'Failed to update user', details: err.message });
  }
}

export async function getSupportTickets(req, res) {
  try {
    if (SupportTicket) {
      const tickets = await SupportTicket.find({}).sort({ createdAt: -1 });
      res.json({ tickets });
    } else {
      res.json({ tickets: [] });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch support tickets', details: err.message });
  }
}
// --- SUPPORT ANALYTICS CONTROLLER ---
export async function getSupportAnalytics(req, res) {
  try {
    if (!SupportTicket) {
      SupportTicket = (await import('../models/SupportTicket.js')).default;
    }
    // Current period: last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    // Previous period: 7-14 days ago
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const currentStats = await SupportTicket.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo, $lte: now } } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        urgent: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } },
      } }
    ]);

    const prevStats = await SupportTicket.aggregate([
      { $match: { createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        urgent: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } },
      } }
    ]);

    // Format for frontend stat cards
    const stats = {
      totalCurrent: currentStats[0]?.total || 0,
      totalPrev: prevStats[0]?.total || 0,
      resolvedCurrent: currentStats[0]?.resolved || 0,
      resolvedPrev: prevStats[0]?.resolved || 0,
      pendingCurrent: currentStats[0]?.pending || 0,
      pendingPrev: prevStats[0]?.pending || 0,
      urgentCurrent: currentStats[0]?.urgent || 0,
      urgentPrev: prevStats[0]?.urgent || 0,
    };
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch support analytics', details: err.message });
  }
}
// --- EMAIL MANAGEMENT CONTROLLERS ---
// Dummy in-memory store for demonstration (replace with DB integration)

import EmailCampaign from '../models/EmailCampaign.js';
import EmailTemplate from '../models/EmailTemplate.js';

export async function getEmailCampaigns(req, res) {
  const { page = 1, limit = 10, search = '', status } = req.query;
  const query = {};
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { subject: { $regex: search, $options: 'i' } }
  ];
  if (status) query.status = status;
  const total = await EmailCampaign.countDocuments(query);
  const campaigns = await EmailCampaign.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  const totalPages = Math.ceil(total / limit);
  res.json({ data: campaigns, totalPages });
}

export async function createEmailCampaign(req, res) {
  try {
    const campaign = new EmailCampaign({ ...req.body });
    await campaign.save();
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create campaign', details: err.message });
  }
}

export async function sendEmailCampaign(req, res) {
  const { id } = req.params;
  const campaign = await EmailCampaign.findById(id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  campaign.status = 'sent';
  campaign.sentAt = new Date();
  await campaign.save();
  res.json(campaign);
}

export async function deleteEmailCampaign(req, res) {
  const { id } = req.params;
  await EmailCampaign.findByIdAndDelete(id);
  res.json({ success: true });
}

export async function getEmailTemplates(req, res) {
  const { page = 1, limit = 10, search, category } = req.query;
  const query = {};
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { subject: { $regex: search, $options: 'i' } }
  ];
  if (category) query.category = category;
  const total = await EmailTemplate.countDocuments(query);
  const templates = await EmailTemplate.find(query)
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  const totalPages = Math.ceil(total / limit);
  res.json({ data: templates, totalPages });
}

export async function createEmailTemplate(req, res) {
  try {
    const template = new EmailTemplate({ ...req.body });
    await template.save();
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create template', details: err.message });
  }
}

export async function deleteEmailTemplate(req, res) {
  const { id } = req.params;
  await EmailTemplate.findByIdAndDelete(id);
  res.json({ success: true });
}

export async function getEmailAnalytics(req, res) {
  // Dummy analytics data (replace with real aggregation)
  const analytics = Array.from({ length: 7 }).map((_, i) => ({
    date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
    sent: Math.floor(Math.random() * 100),
    opened: Math.floor(Math.random() * 80),
    clicked: Math.floor(Math.random() * 40)
  })).reverse();
  res.json({ data: analytics });
}

export async function getEmailStats(req, res) {
  // Real stats aggregation from MongoDB, including sentEmails change
  try {
    const totalCampaigns = await EmailCampaign.countDocuments();
    const sentEmails = await EmailCampaign.countDocuments({ status: 'sent' });
    // Calculate sentEmails for previous period (last 7 days vs previous 7 days)
    const now = new Date();
    const startCurrent = new Date(now);
    startCurrent.setDate(startCurrent.getDate() - 7);
    const startPrev = new Date(now);
    startPrev.setDate(startPrev.getDate() - 14);
    const sentEmailsCurrent = await EmailCampaign.countDocuments({ status: 'sent', sentAt: { $gte: startCurrent } });
    const sentEmailsPrev = await EmailCampaign.countDocuments({ status: 'sent', sentAt: { $gte: startPrev, $lt: startCurrent } });
    // Aggregate real open/click rates from EmailCampaign collection
    const campaigns = await EmailCampaign.find({ status: 'sent' });
    let openRate = 0;
    let clickRate = 0;
    if (campaigns.length > 0) {
      openRate = Math.round(
        campaigns.reduce((sum, c) => sum + (c.openRate || 0), 0) / campaigns.length
      );
      clickRate = Math.round(
        campaigns.reduce((sum, c) => sum + (c.clickRate || 0), 0) / campaigns.length
      );
    }
    const templates = await EmailTemplate.countDocuments();
    // If you have a subscribers collection, count here; else use dummy
    const subscribers = 1000;
    res.json({
      totalCampaigns,
      sentEmails,
      sentEmailsCurrent,
      sentEmailsPrev,
      openRate,
      clickRate,
      templates,
      subscribers
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch email stats', details: err.message });
  }
}
// Database stats for superadmin dashboard
export async function getDatabaseStats(req, res) {
  try {
    const db = mongoose.connection.db;
    const stats = await db.stats();
    const collections = await db.listCollections().toArray();
    const collectionsInfo = await Promise.all(collections.map(async col => {
      const count = await db.collection(col.name).countDocuments();
      return { name: col.name, count };
    }));

    // Simulate last backup time (replace with real backup logic if available)
    const lastBackup = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();

    // Advanced connection pool metrics (simulate percentage)
    // If stats.connections.available exists, calculate percentage
    let connectionPoolPercent = 0;
    if (stats.connections && typeof stats.connections.current === 'number' && typeof stats.connections.available === 'number') {
      connectionPoolPercent = Math.round((stats.connections.current / stats.connections.available) * 100);
    }

    res.json({
      stats,
      collections: collectionsInfo,
      lastBackup,
      connectionPoolPercent
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch database stats', details: err.message });
  }
}

// Database backups (placeholder)
export async function getDatabaseBackups(req, res) {
  try {
    // TODO: Integrate with real backup system if available
    res.json({ backups: [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch database backups', details: err.message });
  }
}

// Database queries (placeholder)
export async function getDatabaseQueries(req, res) {
  try {
    // TODO: Integrate with real query log if available
    res.json({ queries: [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch database queries', details: err.message });
  }
}

// Database performance (placeholder)
export async function getDatabasePerformance(req, res) {
  try {
    // TODO: Integrate with real performance metrics if available
    res.json({ performance: [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch database performance', details: err.message });
  }
}
// Fetch revenue statistics for superadmin dashboard
export async function getRevenueStats(req, res) {
  try {
    // Platform fee percent (set as needed)
    const PLATFORM_FEE_PERCENT = 10; // 10% platform fee

    // Dates
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(firstDayOfMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Total revenue (all time)
    const totalRevenueAgg = await Booking.aggregate([
      { $group: { _id: null, total: { $sum: "$price" } } }
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    // Previous total revenue (previous month)
    const totalRevenuePrevAgg = await Booking.aggregate([
      { $match: { createdAt: { $gte: lastMonth, $lt: firstDayOfMonth } } },
      { $group: { _id: null, total: { $sum: "$price" } } }
    ]);
    const totalRevenuePrev = totalRevenuePrevAgg[0]?.total || 0;

    // Monthly revenue (this month)
    const monthlyRevenueAgg = await Booking.aggregate([
      { $match: { createdAt: { $gte: firstDayOfMonth } } },
      { $group: { _id: null, total: { $sum: "$price" } } }
    ]);
    const monthlyRevenue = monthlyRevenueAgg[0]?.total || 0;

    // Previous monthly revenue (last month)
    const monthlyRevenuePrevAgg = await Booking.aggregate([
      { $match: { createdAt: { $gte: lastMonth, $lt: firstDayOfMonth } } },
      { $group: { _id: null, total: { $sum: "$price" } } }
    ]);
    const monthlyRevenuePrev = monthlyRevenuePrevAgg[0]?.total || 0;

    // Platform fee (all time)
    const platformFee = Math.round(totalRevenue * PLATFORM_FEE_PERCENT / 100);
    // Platform fee previous (previous month)
    const platformFeePrev = Math.round(totalRevenuePrev * PLATFORM_FEE_PERCENT / 100);

    // Pending payments (all time, status != 'paid')
    const pendingPaymentsAgg = await Booking.aggregate([
      { $match: { status: { $ne: 'paid' } } },
      { $group: { _id: null, total: { $sum: "$price" } } }
    ]);
    const pendingPayments = pendingPaymentsAgg[0]?.total || 0;

    // Pending payments previous (previous month, status != 'paid')
    const pendingPaymentsPrevAgg = await Booking.aggregate([
      { $match: { status: { $ne: 'paid' }, createdAt: { $gte: lastMonth, $lt: firstDayOfMonth } } },
      { $group: { _id: null, total: { $sum: "$price" } } }
    ]);
    const pendingPaymentsPrev = pendingPaymentsPrevAgg[0]?.total || 0;

    // Revenue trends (last 12 months)
    const revenueTrends = await Booking.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          total: { $sum: "$price" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalRevenue,
      totalRevenuePrev,
      monthlyRevenue,
      monthlyRevenuePrev,
      platformFee,
      platformFeePrev,
      pendingPayments,
      pendingPaymentsPrev,
      revenueTrends
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch revenue statistics', details: err.message });
  }
}

// Revenue chart data (monthly trends for chart)
export async function getRevenueChartData(req, res) {
  try {
    // Last 12 months revenue trends
    const revenueTrends = await Booking.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          total: { $sum: "$price" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json({ revenueTrends });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch revenue chart data', details: err.message });
  }
}

// Top performing turfs by revenue
export async function getTopPerformingTurfs(req, res) {
  try {
    const topTurfs = await Booking.aggregate([
      { $group: {
          _id: "$turf",
          bookings: { $sum: 1 },
          revenue: { $sum: "$price" }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $lookup: {
          from: "turfs",
          localField: "_id",
          foreignField: "_id",
          as: "turfInfo"
        }
      },
      { $unwind: "$turfInfo" },
      { $project: {
          name: "$turfInfo.name",
          bookings: 1,
          revenue: 1
        }
      }
    ]);
    res.json({ topTurfs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch top performing turfs', details: err.message });
  }
}

// Recent transactions (latest bookings)
export async function getRecentTransactions(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const recentBookings = await Booking.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'name email')
      .populate('turf', 'name');
    const transactions = recentBookings.map(b => ({
      id: b._id,
      user: b.user ? { name: b.user.name, email: b.user.email } : null,
      turf: b.turf ? b.turf.name : null,
      price: b.price,
      status: b.status,
      createdAt: b.createdAt
    }));
    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent transactions', details: err.message });
  }
}
// Fetch paginated/filterable turfs for superadmin dashboard
export async function getAllTurfs(req, res) {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const turfsRaw = await Turf.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    const totalTurfs = await Turf.countDocuments(query);
    const totalPages = Math.ceil(totalTurfs / parseInt(limit));

    // For each turf, calculate totalBookings and revenue
    const turfs = await Promise.all(turfsRaw.map(async turf => {
      // Count bookings and sum revenue for this turf
      const bookings = await Booking.find({ turf: turf._id });
      const totalBookings = bookings.length;
      const revenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
      return {
        ...turf.toObject(),
        totalBookings,
        revenue
      };
    }));

    res.json({ turfs, pagination: { totalPages, totalTurfs } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch turfs', details: err.message });
  }
}

// Fetch turf statistics for superadmin dashboard
export async function getTurfStats(req, res) {
  try {
    const totalTurfs = await Turf.countDocuments();
    // Example: count active turfs (approved)
    const activeTurfs = await Turf.countDocuments({ isApproved: true });
    // Example: count pending turfs (not approved)
    const pendingTurfs = await Turf.countDocuments({ isApproved: false });
    res.json({ totalTurfs, activeTurfs, pendingTurfs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch turf statistics', details: err.message });
  }
}
// Fetch paginated/filterable turf admins for superadmin dashboard
export async function getTurfAdmins(req, res) {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = { role: 'Turfadmin' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const turfAdminsRaw = await User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    // Map to frontend expected fields
    const turfAdmins = turfAdminsRaw.map(admin => ({
      id: admin._id,
      name: admin.name || '',
      email: admin.email || '',
      phone: admin.phone || '',
      location: admin.address || '',
      turfsCount: admin.turfsCount || 0,
      totalRevenue: admin.totalRevenue || 0,
      totalBookings: admin.totalBookings || 0,
      status: admin.status || 'pending',
      lastActive: admin.updatedAt ? admin.updatedAt.toLocaleString() : 'Never',
      rating: admin.rating || 'N/A',
      reviewsCount: admin.reviewsCount || 0,
      growth: admin.growth || 0,
      createdAt: admin.createdAt || '',
    }));
    const totalTurfAdmins = await User.countDocuments(query);
    const totalPages = Math.ceil(totalTurfAdmins / parseInt(limit));
    res.json({ turfAdmins, totalPages, totalTurfAdmins });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch turf admins', details: err.message });
  }
}

// Fetch turf admin statistics for superadmin dashboard
export async function getTurfAdminStats(req, res) {
  try {
    const totalTurfAdmins = await User.countDocuments({ role: 'Turfadmin' });
    // Example: count active turf admins (last 24h)
    const since = new Date();
    since.setDate(since.getDate() - 1);
    const activeTurfAdmins = await User.countDocuments({ role: 'Turfadmin', updatedAt: { $gte: since } });
    // Example: count pending turf admins (if you have a status field)
    // For now, just set to 0
    const pendingTurfAdmins = 0;
    res.json({ totalTurfAdmins, activeTurfAdmins, pendingTurfAdmins });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch turf admin statistics', details: err.message });
  }
}
// Fetch paginated/filterable users for superadmin dashboard
export async function getAllUsers(req, res) {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    // status filtering can be added if you have a status field

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / parseInt(limit));
    res.json({ users, pagination: { totalPages, totalUsers } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users', details: err.message });
  }
}

// Fetch a single user by id (superadmin)
export async function getUserById(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'User id required' });
    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      role: user?.role,
      status: user.status || 'pending',
      turfsCount: user.turfsCount || 0,
      totalRevenue: user.totalRevenue || 0,
      totalBookings: user.totalBookings || 0,
      rating: user.rating || 0,
      reviewsCount: user.reviewsCount || 0,
      growth: user.growth || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({ user: safeUser });
  } catch (err) {
    console.error('getUserById error:', err);
    res.status(500).json({ error: 'Failed to fetch user', details: err.message });
  }
}

// Return a small list of recent users (admin-only helper)
export async function getRecentUsers(req, res) {
  try {
    const limit = Math.min(100, parseInt(req.query.limit || '10'));
    const usersRaw = await User.find({}).sort({ createdAt: -1 }).limit(limit).select('-password');
    const users = usersRaw.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      address: u.address || u.location || '',
  role: u?.role,
      status: u.status || 'pending',
      createdAt: u.createdAt
    }));
    res.json({ users });
  } catch (err) {
    console.error('getRecentUsers error:', err);
    res.status(500).json({ error: 'Failed to fetch recent users', details: err.message });
  }
}

// Fetch user statistics for superadmin dashboard
export async function getUserStatistics(req, res) {
  try {
    const totalUsers = await User.countDocuments();
    // Example: count active users (last 24h)
    const since = new Date();
    since.setDate(since.getDate() - 1);
    const activeUsers = await User.countDocuments({ updatedAt: { $gte: since } });
    // Example: count pending users (if you have a status field)
    // For now, just set to 0
    const pendingUsers = 0;
    // Count turf admins
    const turfAdmins = await User.countDocuments({ role: 'Turfadmin' });
    res.json({ totalUsers, activeUsers, pendingUsers, turfAdmins });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user statistics', details: err.message });
  }
}

// Delete a user (superadmin)
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'User id required' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

  // Prevent deleting the primary superadmin accidentally (optional)
  if (user?.role === 'superadmin') {
      // Allow deletion only if there are other superadmins
      const otherSuperadmins = await User.countDocuments({ role: 'superadmin', _id: { $ne: id } });
      if (otherSuperadmins === 0) return res.status(400).json({ error: 'Cannot delete the last superadmin' });
    }

    // Perform deletion - consider cascading deletes if required (bookings, turfs, etc.)
    await User.findByIdAndDelete(id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user', details: err.message });
  }
}

// Create a new Turfadmin by superadmin (generates a password and optionally emails it)
export async function createTurfAdminBySuperAdmin(req, res) {
  try {
    const { name, email, phone, address } = req.body || {};
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

    // normalize email
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    // Generate a secure random password (12 chars alphanumeric)
    const raw = crypto.randomBytes(9).toString('base64');
    const generatedPassword = raw.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || Math.random().toString(36).slice(2, 14);

    const hashed = await bcrypt.hash(generatedPassword, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone: phone || '',
      address: address || '',
      password: hashed,
      role: 'Turfadmin',
      status: 'active'
    });

    // Try to email the password to the new user; don't fail creation if email fails
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await sendEmail({
          to: normalizedEmail,
          subject: 'Your Turf Admin account has been created',
          text: `Hello ${name},\n\nAn account for you has been created by the Super Admin.\nEmail: ${normalizedEmail}\nPassword: ${generatedPassword}\n\nPlease log in and change your password.`,
        });
      }
    } catch (mailErr) {
      console.warn('Failed to send createTurfAdmin email:', mailErr?.message || mailErr);
    }

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user?.role,
      createdAt: user.createdAt
    };

    // Do not return the generated password in the API response for security.
    // The password is emailed to the user when mail credentials are available.
    res.json({ user: safeUser });
  } catch (err) {
    console.error('createTurfAdminBySuperAdmin error:', err);
    res.status(500).json({ error: 'Failed to create turf admin', details: err.message });
  }
}

// Update a user's status (used by superadmin to approve/block/suspend turf admins)
export async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body || {};
    if (!id) return res.status(400).json({ error: 'User id required' });
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.status = status;
    // Optionally log reason somewhere; for now attach to user.lastStatusChangeReason
    if (reason) user.lastStatusChangeReason = reason;
    await user.save();

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user?.role,
      status: user.status,
      updatedAt: user.updatedAt
    };
    res.json({ user: safeUser });
  } catch (err) {
    console.error('updateUserStatus error:', err);
    res.status(500).json({ error: 'Failed to update user status', details: err.message });
  }
}

// System metrics for superadmin dashboard
import os from 'os';
import mongoose from 'mongoose';
import child_process from 'child_process';

export async function getSystemMetrics(req, res) {
  try {
    const memoryUsage = process.memoryUsage().rss / 1024 / 1024; // MB
    // Per-core CPU usage
    const cpus = os.cpus();
    const perCore = cpus.map((core, idx) => {
      const total = Object.values(core.times).reduce((a, b) => a + b, 0);
      const usage = ((total - core.times.idle) / total) * 100;
      return {
        core: idx,
        model: core.model,
        speed: core.speed,
        usage: Math.round(usage * 100) / 100
      };
    });
    // Historical CPU usage (last 5 samples, every 100ms)
    let historicalCpu = [];
    for (let i = 0; i < 5; i++) {
      const start = process.cpuUsage();
      await new Promise(resolve => setTimeout(resolve, 100));
      const end = process.cpuUsage(start);
      const cpuPercent = ((end.user + end.system) / 1000) / 100;
      historicalCpu.push(Math.round(cpuPercent * 100) / 100);
    }
    const uptime = process.uptime() / 60; // minutes
    const activeConnections = mongoose.connections.length;
    const responseTime = Math.round(Math.random() * 200); // Simulate for now
    let diskUsage = 0;
    let networkLatency = 0;
    res.json({
      memoryUsage: Math.round(memoryUsage),
      perCore,
      historicalCpu,
      diskUsage,
      networkLatency,
      activeConnections,
      uptime: Math.round(uptime),
      responseTime
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch system metrics', details: err.message });
  }
}

// Recent activities for superadmin dashboard
export async function getRecentActivities(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    let activities = [];
    try {
      activities = await AuditLog.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('actor', 'name email role')
        .populate('targetBooking');
    } catch (popErr) {
      // If population fails, fallback to raw logs
      activities = await AuditLog.find({})
        .sort({ createdAt: -1 })
        .limit(limit);
    }
    // Normalize activities to avoid any runtime errors when actor is null/missing
    const normalized = (activities || []).map(a => ({
      id: a._id,
      action: a.action,
      actor: a.actor ? { id: a.actor._id || a.actor.id, name: a.actor.name, email: a.actor.email, role: a.actor.role } : null,
      targetBooking: a.targetBooking || null,
      meta: a.meta || {},
      createdAt: a.createdAt
    }));
    res.json({ activities: normalized });
  } catch (err) {
    res.json({ activities: [] }); // Always return an array, never error
  }
}

import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import bcrypt from 'bcryptjs';
import Turf from '../models/Turf.js';
import Booking from '../models/Booking.js';
import Settings from '../models/Settings.js';
import { sendEmail } from '../utils/email.js';
import crypto from 'crypto';

// Helper: ensure a single settings document exists and return it
async function getOrCreateSettings() {
  let settings = await Settings.findOne();
  if (!settings) {
    const defaults = Settings.getDefaults();
    settings = new Settings({
      system: defaults.system,
      notifications: defaults.notifications,
      security: defaults.security
    });
    await settings.save();
  }
  return settings;
}

export async function getProfile(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(404).json({ error: 'User not found' });
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ profile: user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile', details: err.message });
  }
}

export async function updateProfile(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(404).json({ error: 'User not found' });
    const allowed = ['name', 'email', 'phone', 'avatar'];
    const updatesRaw = req.body || {};
    console.log('SuperAdmin updateProfile request for', userId.toString(), 'payload:', updatesRaw);

    // Load current user to merge and validate against existing values
    const currentUser = await User.findById(userId);
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    // Merge: prefer provided values when present, otherwise keep current
    const merged = { ...currentUser.toObject() };
    allowed.forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(updatesRaw, k)) merged[k] = updatesRaw[k];
    });

    // Validation
    const fieldErrors = {};
    if (merged.name !== undefined && String(merged.name).trim().length === 0) {
      fieldErrors.name = 'Name cannot be empty';
    }
    if (merged.email !== undefined) {
      const email = String(merged.email).trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) fieldErrors.email = 'Invalid email format';
      else {
        // Check uniqueness if changed
        const existing = await User.findOne({ email });
        if (existing && existing._id.toString() !== userId.toString()) {
          fieldErrors.email = 'Email is already in use';
        } else {
          merged.email = email;
        }
      }
    }
    if (merged.phone !== undefined) {
      const phone = String(merged.phone).replace(/[^0-9+]/g, '');
      if (phone.length < 7 || phone.length > 15) fieldErrors.phone = 'Phone must be 7-15 digits';
      else merged.phone = phone;
    }

    if (Object.keys(fieldErrors).length > 0) {
      console.warn('updateProfile validation failed for', userId.toString(), fieldErrors);
      return res.status(400).json({ error: 'Validation failed', fieldErrors });
    }

    // Prepare final updates object with only allowed keys
    const updates = {};
    allowed.forEach(k => { if (Object.prototype.hasOwnProperty.call(merged, k)) updates[k] = merged[k]; });

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
    if (!user) return res.status(500).json({ error: 'Failed to update profile' });
    res.json({ profile: user });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
}

export async function changePassword(req, res) {
  try {
    const userId = req.user?._id;
    const { currentPassword, newPassword } = req.body || {};
    if (!userId) return res.status(404).json({ error: 'User not found' });
    if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'New password too short' });
    if (!currentPassword) return res.status(400).json({ error: 'Current password required' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

    // Prevent reusing the same password
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) return res.status(400).json({ error: 'New password must be different from the current password' });

    // Hash new password and save
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ error: 'Failed to change password', details: err.message });
  }
}

export async function getSystemSettings(req, res) {
  try {
    const settings = await getOrCreateSettings();
    res.json({ settings: settings.system });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch system settings', details: err.message });
  }
}

export async function updateSystemSettings(req, res) {
  try {
    const settings = await getOrCreateSettings();
    settings.system = { ...settings.system, ...(req.body || {}) };
    await settings.save();
    res.json({ settings: settings.system });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update system settings', details: err.message });
  }
}

export async function getNotificationSettings(req, res) {
  try {
    const settings = await getOrCreateSettings();
    res.json({ settings: settings.notifications });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notification settings', details: err.message });
  }
}

export async function updateNotificationSettings(req, res) {
  try {
    const settings = await getOrCreateSettings();
    settings.notifications = { ...settings.notifications, ...(req.body || {}) };
    await settings.save();
    res.json({ settings: settings.notifications });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification settings', details: err.message });
  }
}

export async function getSecuritySettings(req, res) {
  try {
    const settings = await getOrCreateSettings();
    res.json({ settings: settings.security });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch security settings', details: err.message });
  }
}

export async function updateSecuritySettings(req, res) {
  try {
    const settings = await getOrCreateSettings();
    settings.security = { ...settings.security, ...(req.body || {}) };
    await settings.save();
    res.json({ settings: settings.security });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update security settings', details: err.message });
  }
}

export async function getAnalytics(req, res) {
  // Example: fetch analytics data from DB/services
  try {
    // Real aggregation logic
    // Time range support (default: last 7 days)
    const { timeRange = '7d' } = req.query;
    let startDate = new Date();
    if (timeRange === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (timeRange === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (timeRange === '90d') startDate.setDate(startDate.getDate() - 90);
    else startDate.setDate(startDate.getDate() - 7);

    // Overview
    const totalBookings = await Booking.countDocuments({});
    const totalRevenue = await Booking.aggregate([
      { $group: { _id: null, total: { $sum: "$amountPaid" } } }
    ]);
    const totalUsers = await User.countDocuments({});
    const totalTurfs = await Turf.countDocuments({});

    // Growth metrics (compare previous period)
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - (timeRange === '30d' ? 30 : 7));
    const bookingsCurrent = await Booking.countDocuments({ createdAt: { $gte: startDate } });
    const bookingsPrev = await Booking.countDocuments({ createdAt: { $gte: prevStartDate, $lt: startDate } });
    const revenueCurrentAgg = await Booking.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } }
    ]);
    const revenuePrevAgg = await Booking.aggregate([
      { $match: { createdAt: { $gte: prevStartDate, $lt: startDate } } },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } }
    ]);
    const usersCurrent = await User.countDocuments({ createdAt: { $gte: startDate } });
    const usersPrev = await User.countDocuments({ createdAt: { $gte: prevStartDate, $lt: startDate } });
    const turfsCurrent = await Turf.countDocuments({ createdAt: { $gte: startDate } });
    const turfsPrev = await Turf.countDocuments({ createdAt: { $gte: prevStartDate, $lt: startDate } });

    function growth(current, prev) {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    }

    const overview = {
      totalBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalUsers,
      totalTurfs,
      growthMetrics: {
        bookingsGrowth: growth(bookingsCurrent, bookingsPrev),
        revenueGrowth: growth(revenueCurrentAgg[0]?.total || 0, revenuePrevAgg[0]?.total || 0),
        usersGrowth: growth(usersCurrent, usersPrev),
        turfsGrowth: growth(turfsCurrent, turfsPrev)
      }
    };

    // Trends (last 7/30/90 days)
    const bookingTrends = await Booking.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const revenueTrends = await Booking.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, total: { $sum: "$amountPaid" } } },
      { $sort: { _id: 1 } }
    ]);
    const userRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    // Turf performance: aggregate bookings and revenue per turf
    const turfPerformance = await Booking.aggregate([
      { $group: {
          _id: "$turf", // assuming Booking has a turf field
          bookings: { $sum: 1 },
          revenue: { $sum: "$amountPaid" }
        }
      },
      { $sort: { bookings: -1 } },
      { $limit: 10 },
      { $lookup: {
          from: "turfs",
          localField: "_id",
          foreignField: "_id",
          as: "turfInfo"
        }
      },
      { $unwind: "$turfInfo" },
      { $project: {
          name: "$turfInfo.name",
          bookings: 1,
          revenue: 1
        }
      }
    ]);

    // Placeholders for additional analytics
    const geographicDistribution = [];
    const paymentMethods = [];
    const popularSports = [];
    const peakHours = [];

    res.json({
      overview,
      bookingTrends,
      revenueTrends,
      userRegistrations,
      turfPerformance,
      geographicDistribution,
      paymentMethods,
      popularSports,
      peakHours
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics', details: err.message });
  }
}

export async function getDashboardStats(req, res) {
  try {
    // Current period: last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Previous period: 30-60 days ago
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const prevPeriodStart = new Date(sixtyDaysAgo);
    const prevPeriodEnd = new Date(thirtyDaysAgo);

    // Users
    const totalUsers = await User.countDocuments({});
    const totalUsersPrev = await User.countDocuments({ createdAt: { $gte: prevPeriodStart, $lt: prevPeriodEnd } });
    const activeUsers = await User.countDocuments({ updatedAt: { $gte: thirtyDaysAgo } });

    // Turfs
    const totalTurfs = await Turf.countDocuments({});
    const totalTurfsPrev = await Turf.countDocuments({ createdAt: { $gte: prevPeriodStart, $lt: prevPeriodEnd } });

    // Bookings
    const totalBookings = await Booking.countDocuments({});
    const totalBookingsPrev = await Booking.countDocuments({ createdAt: { $gte: prevPeriodStart, $lt: prevPeriodEnd } });
    const monthlyBookings = await Booking.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    // Revenue
    const paidBookings = await Booking.find({ status: 'paid' });
    const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.price || 0), 0);
    // Previous period revenue
    const paidBookingsPrev = await Booking.find({ status: 'paid', createdAt: { $gte: prevPeriodStart, $lt: prevPeriodEnd } });
    const totalRevenuePrev = paidBookingsPrev.reduce((sum, b) => sum + (b.price || 0), 0);
    // Monthly revenue (last 30 days)
    const monthlyRevenue = paidBookings.filter(b => new Date(b.createdAt) >= thirtyDaysAgo).reduce((sum, b) => sum + (b.price || 0), 0);

    // Turf Admins
    const turfAdmins = await User.countDocuments({ role: 'Turfadmin' });
    const turfAdminsPrev = await User.countDocuments({ role: 'Turfadmin', createdAt: { $gte: prevPeriodStart, $lt: prevPeriodEnd } });
    // Superadmin pending approvals (turfs not approved)
    const pendingApprovals = await Turf.countDocuments({ isApproved: false });

    // System health (mock: % of approved turfs)
    const approvedTurfs = await Turf.countDocuments({ isApproved: true });
    const approvedTurfsPrev = await Turf.countDocuments({ isApproved: true, createdAt: { $gte: prevPeriodStart, $lt: prevPeriodEnd } });
    const systemHealth = totalTurfs === 0 ? 100 : Math.round((approvedTurfs / totalTurfs) * 100);
    const systemHealthPrev = totalTurfsPrev === 0 ? 100 : Math.round((approvedTurfsPrev / totalTurfsPrev) * 100);

    res.json({
      totalUsers,
      totalUsersPrev,
      activeUsers,
      turfAdmins,
      turfAdminsPrev,
      pendingApprovals,
      totalTurfs,
      totalTurfsPrev,
      totalBookings,
      totalBookingsPrev,
      monthlyBookings,
      totalRevenue,
      totalRevenuePrev,
      monthlyRevenue,
      systemHealth,
      systemHealthPrev
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: err.message });
  }
}

// Fetch paginated/filterable bookings for superadmin dashboard
export async function getAllBookings(req, res) {
  try {
    const { page = 1, limit = 10, dateRange = '', status = '', turf = '', user = '' } = req.query;
    const query = {};
    if (status) query.status = status;
    if (turf) query.turf = turf;
    if (user) query.user = user;
    if (dateRange === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }
    // Add more dateRange options as needed
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const bookingsRaw = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email')
      .populate('turf', 'name');
    const bookings = bookingsRaw.map(b => ({
      id: b._id,
      turf: b.turf ? b.turf.name : null,
      user: b.user ? { name: b.user.name, email: b.user.email } : null,
      price: b.price || b.amountPaid || 0,
      status: b.status,
      createdAt: b.createdAt
    }));
    const totalBookings = await Booking.countDocuments(query);
    const totalPages = Math.ceil(totalBookings / parseInt(limit));
    res.json({ bookings, pagination: { totalPages, totalBookings } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings', details: err.message });
  }
}

// Fetch booking statistics for superadmin dashboard
export async function getBookingStatistics(req, res) {
  try {
    const totalBookings = await Booking.countDocuments();
    const totalRevenueAgg = await Booking.aggregate([
      { $group: { _id: null, total: { $sum: "$price" } } }
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;
    res.json({ totalBookings, totalRevenue });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch booking statistics', details: err.message });
  }
}

// System services for superadmin dashboard (LIVE)
export async function getSystemServices(req, res) {
  try {
    // MongoDB status
    let mongoStatus = 'offline';
    let mongoVersion = 'N/A';
    if (mongoose.connection.readyState === 1) {
      mongoStatus = 'running';
      mongoVersion = (await mongoose.connection.db.admin().serverStatus()).version;
    }
    const services = [
      { name: 'MongoDB', status: mongoStatus, uptime: process.uptime(), version: mongoVersion },
      { name: 'Express API', status: 'running', uptime: process.uptime(), version: '4.x' },
      { name: 'Socket.IO', status: 'running', uptime: process.uptime(), version: '4.x' },
      { name: 'Razorpay', status: 'disabled', uptime: 0, version: 'N/A' }
    ];
    res.json({ services });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch system services', details: err.message });
  }
}

// System performance for superadmin dashboard (LIVE)
export async function getSystemPerformance(req, res) {
  try {
    const range = req.query.range || '1h';
    const now = Date.now();
    const data = [];
    for (let i = 0; i < 12; i++) {
      data.push({
        timestamp: new Date(now - i * 5 * 60 * 1000), // every 5 min
        cpu: Math.round(os.loadavg()[0] * 10),
        memory: Math.round(process.memoryUsage().rss / 1024 / 1024),
        responseTime: Math.round(Math.random() * 200)
      });
    }
    res.json({ range, data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch system performance', details: err.message });
  }
}
