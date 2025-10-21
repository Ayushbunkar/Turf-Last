import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname for ESM and load .env explicitly from the server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Small diagnostic to avoid confusing Mongoose when the env var is missing
if (!process.env.MONGO_URI) {
  console.warn('⚠️ MONGO_URI is not defined in server/.env (or not loaded). Check server/.env and dotenv path.');
} else {
  console.log('✅ MONGO_URI found in environment');
}

if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET is not set in server/.env. Authentication will fail for signed tokens.');
} else {
  console.log('✅ JWT_SECRET found in environment');
}

import connectDB from './config/db.js';
import app from './app.js';
import { Server } from 'socket.io';
import http from 'http';

connectDB();
const PORT = process.env.PORT || 4500;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('joinRoom', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

app.set('io', io); // Make io available in routes/controllers if needed

server.on('error', (err) => {
  console.error('Server error event:', err && err.message ? err.message : err);
  // EADDRINUSE is common in dev when multiple instances run
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. If another instance is running, stop it or change PORT.`);
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Server running with Socket.IO at http://localhost:${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err && err.stack ? err.stack : err);
  // Allow nodemon to restart after a crash
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
