
import express from 'express';
import { getAnalytics, getDashboardStats, getRecentActivities, getSystemMetrics, getAllUsers, getUserStatistics, getTurfAdmins, getTurfAdminStats, getAllTurfs, getTurfStats, getRevenueStats, getRevenueChartData, getTopPerformingTurfs, getRecentTransactions, getAllBookings, getBookingStatistics, getSystemServices, getSystemPerformance, getDatabaseStats, getDatabaseBackups, getDatabaseQueries, getDatabasePerformance, getSupportTickets, getProfile, updateProfile, changePassword, getSystemSettings, updateSystemSettings, getNotificationSettings, updateNotificationSettings, getSecuritySettings, updateSecuritySettings } from '../controllers/superadminController.js';
import { getSupportAnalytics } from '../controllers/superadminController.js';
import { verifySuperAdmin } from '../middleware/authMiddleware.js';
import {
	getEmailCampaigns,
	createEmailCampaign,
	sendEmailCampaign,
	deleteEmailCampaign,
	getEmailTemplates,
	createEmailTemplate,
	deleteEmailTemplate,
	getEmailAnalytics,
	getEmailStats
} from '../controllers/superadminController.js';

const router = express.Router();

// Email management endpoints for superadmin dashboard
router.get('/emails/campaigns', verifySuperAdmin, getEmailCampaigns);
router.post('/emails/campaigns', verifySuperAdmin, createEmailCampaign);
router.post('/emails/campaigns/:id/send', verifySuperAdmin, sendEmailCampaign);
router.delete('/emails/campaigns/:id', verifySuperAdmin, deleteEmailCampaign);
router.get('/emails/templates', verifySuperAdmin, getEmailTemplates);
router.post('/emails/templates', verifySuperAdmin, createEmailTemplate);
router.delete('/emails/templates/:id', verifySuperAdmin, deleteEmailTemplate);
router.get('/emails/analytics', verifySuperAdmin, getEmailAnalytics);
router.get('/emails/stats', verifySuperAdmin, getEmailStats);

// Database stats endpoint for superadmin dashboard
router.get('/database/stats', verifySuperAdmin, getDatabaseStats);

// Database backups endpoint for superadmin dashboard
router.get('/database/backups', verifySuperAdmin, getDatabaseBackups);

// Database queries endpoint for superadmin dashboard
router.get('/database/queries', verifySuperAdmin, getDatabaseQueries);

// Database performance endpoint for superadmin dashboard
router.get('/database/performance', verifySuperAdmin, getDatabasePerformance);

// Revenue statistics endpoint for superadmin dashboard
router.get('/revenue/statistics', verifySuperAdmin, getRevenueStats);

// Revenue chart data endpoint
router.get('/revenue/chart', verifySuperAdmin, getRevenueChartData);

// Top performing turfs endpoint
router.get('/revenue/top-turfs', verifySuperAdmin, getTopPerformingTurfs);

// Recent transactions endpoint
router.get('/revenue/recent-transactions', verifySuperAdmin, getRecentTransactions);

// Turfs endpoints for superadmin dashboard
router.get('/turfs', verifySuperAdmin, getAllTurfs);
router.get('/turfs/statistics', verifySuperAdmin, getTurfStats);

// Bookings endpoints for superadmin dashboard
router.get('/bookings', verifySuperAdmin, getAllBookings);
router.get('/bookings/statistics', verifySuperAdmin, getBookingStatistics);

// Turf admins endpoints for superadmin dashboard
router.get('/turfadmins', verifySuperAdmin, getTurfAdmins);
router.get('/turfadmins/statistics', verifySuperAdmin, getTurfAdminStats);
// Allow superadmin to create a turf admin (server generates password and emails it)
router.post('/turfadmins', verifySuperAdmin, async (req, res, next) => {
	try {
		const { createTurfAdminBySuperAdmin } = await import('../controllers/superadminController.js');
		return createTurfAdminBySuperAdmin(req, res, next);
	} catch (err) {
		next(err);
	}
});

// Users endpoints for superadmin dashboard
router.get('/users', verifySuperAdmin, getAllUsers);
router.get('/users/statistics', verifySuperAdmin, getUserStatistics);
// Fetch single user
router.get('/users/:id', verifySuperAdmin, async (req, res, next) => {
	try {
		const { getUserById } = await import('../controllers/superadminController.js');
		return getUserById(req, res, next);
	} catch (err) {
		next(err);
	}
});
// Helper: recent users
router.get('/users/recent', verifySuperAdmin, async (req, res, next) => {
	try {
		const { getRecentUsers } = await import('../controllers/superadminController.js');
		return getRecentUsers(req, res, next);
	} catch (err) {
		next(err);
	}
});
// Delete a user (superadmin)
router.delete('/users/:id', verifySuperAdmin, async (req, res, next) => {
	// delegate to controller function if available
	try {
		// lazy import to avoid circular issues
		const { deleteUser } = await import('../controllers/superadminController.js');
		return deleteUser(req, res, next);
	} catch (err) {
		next(err);
	}
});

// Update a user's status (approve/block/suspend)
router.patch('/users/:id', verifySuperAdmin, async (req, res, next) => {
	try {
		const controllers = await import('../controllers/superadminController.js');
		// If `status` is provided in the body, treat as status change; otherwise update general user fields
		if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'status')) {
			return controllers.updateUserStatus(req, res, next);
		}
		return controllers.updateUser(req, res, next);
	} catch (err) {
		next(err);
	}
});

// Analytics endpoint
router.get('/analytics', verifySuperAdmin, getAnalytics);

// Dashboard stats endpoint for superadmin
router.get('/dashboard-stats', verifySuperAdmin, getDashboardStats);

// Recent activities endpoint
router.get('/recent-activities', verifySuperAdmin, getRecentActivities);

// Support tickets endpoint for superadmin
router.get('/support/tickets', verifySuperAdmin, getSupportTickets);
// Support analytics endpoint for superadmin
router.get('/support/analytics', verifySuperAdmin, getSupportAnalytics);

// Profile and settings endpoints
router.get('/profile', verifySuperAdmin, getProfile);
router.put('/profile', verifySuperAdmin, updateProfile);
router.post('/profile/change-password', verifySuperAdmin, changePassword);

// Settings endpoints
router.get('/settings/system', verifySuperAdmin, getSystemSettings);
router.put('/settings/system', verifySuperAdmin, updateSystemSettings);

router.get('/settings/notifications', verifySuperAdmin, getNotificationSettings);
router.put('/settings/notifications', verifySuperAdmin, updateNotificationSettings);

router.get('/settings/security', verifySuperAdmin, getSecuritySettings);
router.put('/settings/security', verifySuperAdmin, updateSecuritySettings);

// System metrics endpoint
router.get('/system/metrics', verifySuperAdmin, getSystemMetrics);

// System services and performance endpoints
router.get('/system/services', verifySuperAdmin, getSystemServices);
router.get('/system/performance', verifySuperAdmin, getSystemPerformance);

export default router;
