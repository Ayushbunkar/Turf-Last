import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();
// Load .env from server/.env explicitly, so MONGO_URI is available when running from project root
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
/**
 * Migration: normalize role values for turf admins to the canonical "Turfadmin"
 * - Converts any User.role matching /^\s*(admin|turfadmin)\s*$/i to 'Turfadmin'
 * - Safe to run multiple times (idempotent)
 *
 * Usage: node server/scripts/normalize_turfadmin_role.js
 * NOTE: Run this from the repository root. Make a DB backup before running.
 */

const run = async () => {
  try {
    await connectDB();

    console.log('\n[normalize_turfadmin_role] Counting affected users (case-insensitive)...');

    const filterRegex = { role: { $regex: '^(admin|turfadmin)$', $options: 'i' } };

    const totalMatching = await User.countDocuments(filterRegex);
    console.log(`[normalize_turfadmin_role] Users matching /^(admin|turfadmin)$/i : ${totalMatching}`);

    if (totalMatching === 0) {
      console.log('[normalize_turfadmin_role] Nothing to update. Exiting.');
      process.exit(0);
    }

    // Show a small sample (up to 10) before changing
    const sampleBefore = await User.find(filterRegex).select('_id email name role').limit(10).lean();
    console.log('\nSample before update (up to 10):');
    console.table(sampleBefore.map(u => ({ id: u._id.toString(), email: u.email, name: u.name, role: u.role })));

    console.log('\n[normalize_turfadmin_role] Performing update: setting role => "Turfadmin" for matched users...');

    const res = await User.updateMany(filterRegex, { $set: { role: 'Turfadmin' } });

    console.log(`[normalize_turfadmin_role] Matched: ${res.matchedCount}, Modified: ${res.modifiedCount}`);

    const sampleAfter = await User.find({ role: 'Turfadmin' }).select('_id email name role').limit(10).lean();
    console.log('\nSample after update (up to 10):');
    console.table(sampleAfter.map(u => ({ id: u._id.toString(), email: u.email, name: u.name, role: u.role })));

    const remainingLower = await User.countDocuments({ role: { $regex: '^turfadmin$', $options: 'i' }, role: { $ne: 'Turfadmin' } }).catch(()=>0);
    console.log(`\n[normalize_turfadmin_role] Remaining case-insensitive 'turfadmin' that are NOT exactly 'Turfadmin': ${remainingLower}`);

    console.log('\n[normalize_turfadmin_role] Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('[normalize_turfadmin_role] Migration failed:', err);
    process.exit(1);
  } finally {
    try { await mongoose.connection.close(); } catch (e) {}
  }
};

run();
