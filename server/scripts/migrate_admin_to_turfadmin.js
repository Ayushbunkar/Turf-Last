#!/usr/bin/env node
// Simple migration script to rename user.role 'admin' -> 'turfadmin'
// Usage: node migrate_admin_to_turfadmin.js

import dotenv from 'dotenv';
dotenv.config({ path: process.env.DOTENV_PATH || '.env' });

import connectDB from '../config/db.js';
import mongoose from 'mongoose';
import User from '../models/User.js';

const run = async () => {
  await connectDB();
  try {
    const filter = { role: 'admin' };
    const update = { $set: { role: 'turfadmin' } };
    console.log('Searching for users with role=admin...');
    const count = await User.countDocuments(filter);
    console.log(`Found ${count} user(s) with role 'admin'`);
    if (count === 0) {
      console.log('Nothing to do. Exiting.');
      process.exit(0);
    }
    const res = await User.updateMany(filter, update);
    console.log(`Modified ${res.modifiedCount} document(s)`);
    // Optional: show affected user ids
    const updated = await User.find({ role: 'turfadmin' }).select('_id email name').limit(20).lean();
    console.log('Sample updated users:', updated.map(u => ({ id: u._id, email: u.email, name: u.name })).slice(0, 20));
    console.log('Migration complete. You may need to restart the server/clients.');
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(2);
  } finally {
    mongoose.connection.close();
  }
};

run();
