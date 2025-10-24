import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { updateMe, getMe, getSettings, updateSettings } from '../controllers/userController.js';
import { listNotifications, deleteNotification, markNotificationRead, markAllNotificationsRead, bulkDeleteNotifications } from '../controllers/notificationController.js';

const router = express.Router();

// Get current user's profile
router.get('/me', protect, getMe);

// Update current user's profile (name, email, phone, location, dateOfBirth)
router.patch('/me', protect, updateMe);

// User-specific settings (per-user)
router.get('/settings', protect, getSettings);
router.patch('/settings', protect, updateSettings);

// User notifications endpoints (DB-backed)
router.get('/notifications', protect, listNotifications);
router.delete('/notifications/:id', protect, deleteNotification);
router.patch('/notifications/:id/read', protect, markNotificationRead);
router.patch('/notifications/mark-all-read', protect, markAllNotificationsRead);
router.delete('/notifications/bulk-delete', protect, bulkDeleteNotifications);

export default router;
