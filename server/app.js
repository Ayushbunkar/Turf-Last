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


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/turfs', turfRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use('/api/superadmin', superadminRoutes);
app.use('/api/turfadmin', turfadminRoutes);
app.use('/api/user', userRoutes);
// Direct superadmin endpoint for legacy/frontend compatibility
app.use('/superadmin', superadminRoutes);

app.get('/', (req, res) => res.json({ message: 'Server app running' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err?.message || err);
  res.status(err?.statusCode || 500).json({ message: err?.message || 'Internal Server Error' });
});

export default app;
