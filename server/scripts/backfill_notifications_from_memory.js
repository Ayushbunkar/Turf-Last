#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import connectDB from '../config/db.js';
import Notification from '../models/Notification.js';

async function run() {
  await connectDB();
  if (!global.__userNotifications) {
    console.log('No in-memory notifications found. Nothing to backfill.');
    process.exit(0);
  }
  const map = global.__userNotifications;
  let total = 0;
  for (const [userId, list] of map.entries()) {
    for (const n of list) {
      // Skip if already exists (by message and meta.bookingId and createdAt)
      const exists = await Notification.findOne({ user: userId, 'meta.bookingId': n.meta?.bookingId, title: n.title }).lean();
      if (exists) continue;
      await Notification.create({
        user: userId,
        title: n.title || 'Notification',
        message: n.message || '',
        type: n.type || 'info',
        meta: n.meta || {},
        data: n.data || {},
        read: !!n.read,
        createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
      });
      total++;
    }
  }
  console.log(`Backfilled ${total} notifications into DB.`);
  process.exit(0);
}

run().catch((e) => {
  console.error('Backfill failed', e && e.message ? e.message : e);
  process.exit(1);
});
