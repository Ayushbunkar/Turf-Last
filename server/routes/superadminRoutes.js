
import express from 'express';
import { getAnalytics, getDashboardStats, getRecentActivities, getSystemMetrics, getAllUsers, getUserStatistics, getTurfAdmins, getTurfAdminStats, getAllTurfs, getTurfStats, getRevenueStats, getRevenueChartData, getTopPerformingTurfs, getRecentTransactions, getAllBookings, getBookingStatistics, getSystemServices, getSystemPerformance, getDatabaseStats, getDatabaseBackups, getDatabaseQueries, getDatabasePerformance, getSupportTickets, getProfile, updateProfile, changePassword, getSystemSettings, updateSystemSettings, getNotificationSettings, updateNotificationSettings, getSecuritySettings, updateSecuritySettings, batchUpdateTurfsStatus } from '../controllers/superadminController.js';
import { getNotifications, markAllNotificationsRead } from '../controllers/superadminController.js';
import { deleteTurf as deleteTurfController } from '../controllers/turfController.js';
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
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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

// Create a new backup (manual trigger)
router.post('/database/backups', verifySuperAdmin, async (req, res, next) => {
	try {
		const { createDatabaseBackup } = await import('../controllers/superadminController.js');
		return createDatabaseBackup(req, res, next);
	} catch (err) {
		next(err);
	}
});

// Download a backup file
router.get('/database/backups/:id/download', verifySuperAdmin, async (req, res, next) => {
	try {
		const { downloadBackup } = await import('../controllers/superadminController.js');
		return downloadBackup(req, res, next);
	} catch (err) {
		next(err);
	}
});

// Restore a backup
router.post('/database/backups/:id/restore', verifySuperAdmin, async (req, res, next) => {
	try {
		const { restoreDatabaseBackup } = await import('../controllers/superadminController.js');
		return restoreDatabaseBackup(req, res, next);
	} catch (err) {
		next(err);
	}
});

// Delete a backup
router.delete('/database/backups/:id', verifySuperAdmin, async (req, res, next) => {
	try {
		const { deleteBackup } = await import('../controllers/superadminController.js');
		return deleteBackup(req, res, next);
	} catch (err) {
		next(err);
	}
});

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

// DEBUG: public routes (no auth) to help local debugging/verification
router.get('/debug/revenue/statistics', getRevenueStats);
router.get('/debug/revenue/chart', getRevenueChartData);
router.get('/debug/revenue/top-turfs', getTopPerformingTurfs);
router.get('/debug/revenue/recent-transactions', getRecentTransactions);

// Turfs endpoints for superadmin dashboard
router.get('/turfs', verifySuperAdmin, getAllTurfs);
// Protected statistics endpoint
router.get('/turfs/statistics', verifySuperAdmin, getTurfStats);
// Batch status update (superadmin) - accepts { turfIds: [], status: 'blocked', reason?: '' }
router.patch('/turfs/batch-status', verifySuperAdmin, async (req, res, next) => {
	try {
		const { batchUpdateTurfsStatus } = await import('../controllers/superadminController.js');
		return batchUpdateTurfsStatus(req, res, next);
	} catch (err) {
		next(err);
	}
});
// Public test endpoint (development only) - returns same stats without auth to help debugging the UI
router.get('/turfs/statistics/public', getTurfStats);
// Allow superadmin to delete any turf (uses deleteTurf from turfController)
router.delete('/turfs/:id', verifySuperAdmin, deleteTurfController);

// Bookings endpoints for superadmin dashboard
router.get('/bookings', verifySuperAdmin, getAllBookings);
router.get('/bookings/statistics', verifySuperAdmin, getBookingStatistics);
// CSV import for bookings (upload CSV file)
router.post('/bookings/import', verifySuperAdmin, upload.single('file'), async (req, res, next) => {
	try {
		const { importBookingsCSV } = await import('../controllers/superadminController.js');
		return importBookingsCSV(req, res, next);
	} catch (err) {
		next(err);
	}
});

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

// PATCH: update turf admin details
router.patch('/turfadmins/:id', verifySuperAdmin, async (req, res, next) => {
	try {
		const { updateTurfAdminBySuperAdmin } = await import('../controllers/superadminController.js');
		return updateTurfAdminBySuperAdmin(req, res, next);
	} catch (err) {
		next(err);
	}
});

// Users endpoints for superadmin dashboard
// Create a user (superadmin)
router.post('/users', verifySuperAdmin, async (req, res, next) => {
	try {
		const { createUserBySuperAdmin } = await import('../controllers/superadminController.js');
		return createUserBySuperAdmin(req, res, next);
	} catch (err) {
		next(err);
	}
});
router.get('/users', verifySuperAdmin, getAllUsers);
router.get('/users/statistics', verifySuperAdmin, getUserStatistics);
// Create user (superadmin)
router.post('/users', verifySuperAdmin, async (req, res, next) => {
	try {
		const { createUserBySuperAdmin } = await import('../controllers/superadminController.js');
		return createUserBySuperAdmin(req, res, next);
	} catch (err) {
		next(err);
	}
});
// Export users to CSV
router.get('/users/export', verifySuperAdmin, async (req, res, next) => {
	try {
		const { exportUsersCSV } = await import('../controllers/superadminController.js');
		return exportUsersCSV(req, res, next);
	} catch (err) {
		next(err);
	}
});
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

// Notifications endpoints for superadmin
router.get('/notifications', verifySuperAdmin, getNotifications);
router.patch('/notifications/mark-all-read', verifySuperAdmin, markAllNotificationsRead);

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
