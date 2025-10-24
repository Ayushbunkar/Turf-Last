import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Routes
import authRoutes from './routes/authroutes.js';
import turfRoutes from './routes/turfRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import superadminRoutes from './routes/superadminRoutes.js';
import turfadminRoutes from './routes/turfadminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import debugRoutes from './routes/debugRoutes.js';
import { protect } from './middleware/authMiddleware.js';
import {
  getUserNotifications,
  deleteUserNotification,
  markUserNotificationRead,
  markAllUserNotificationsRead,
  bulkDeleteUserNotifications,
} from './controllers/userController.js';

const app = express();

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Dev helper: log DELETE requests to /api/turfs to aid debugging permission/404 issues
app.use((req, res, next) => {
  try {
    if (req.method === 'DELETE' && req.originalUrl && req.originalUrl.startsWith('/api/turfs')) {
      console.log('[DEBUG] Incoming DELETE request:', req.method, req.originalUrl, 'AuthHeaderPresent:', !!req.headers.authorization, 'CookieToken:', !!req.cookies?.token);
    }
  } catch (e) {}
  next();
});


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/turfs', turfRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);

// Dev debug routes (sample data)
app.use('/api/debug', debugRoutes);

app.use('/api/superadmin', superadminRoutes);
app.use('/api/turfadmin', turfadminRoutes);
app.use('/api/user', userRoutes);
// Compatibility routes: frontend historically called /notifications/... without /api prefix
// Map those legacy paths to the same handlers so existing client requests don't 404.
app.get('/notifications/user', protect, getUserNotifications);
app.delete('/notifications/:id', protect, deleteUserNotification);
app.patch('/notifications/:id/read', protect, markUserNotificationRead);
app.patch('/notifications/mark-all-read', protect, markAllUserNotificationsRead);
app.delete('/notifications/bulk-delete', protect, bulkDeleteUserNotifications);
// Direct superadmin endpoint for legacy/frontend compatibility
app.use('/superadmin', superadminRoutes);

// Serve local uploads directory in development if it exists
import fs from 'fs';
const uploadsDir = path.join(process.cwd(), 'uploads');
if (fs.existsSync(uploadsDir)) {
  app.use('/uploads', express.static(uploadsDir));
}

app.get('/', (req, res) => res.json({ message: 'Server app running' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err?.message || err);
  res.status(err?.statusCode || 500).json({ message: err?.message || 'Internal Server Error' });
});

export default app;
