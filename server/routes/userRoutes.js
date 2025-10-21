import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { updateMe, getMe, getSettings, updateSettings } from '../controllers/userController.js';

const router = express.Router();

// Get current user's profile
router.get('/me', protect, getMe);

// Update current user's profile (name, email, phone, location, dateOfBirth)
router.patch('/me', protect, updateMe);

// User-specific settings (per-user)
router.get('/settings', protect, getSettings);
router.patch('/settings', protect, updateSettings);

export default router;
