import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Turf from '../models/Turf.js';
import User from '../models/User.js';

dotenv.config();

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/turf-db';

async function main() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');

  // Find a superadmin to assign as owner
  const superadmin = await User.findOne({ role: 'superadmin' });
  if (!superadmin) {
    console.error('No superadmin found. Please create one first.');
    process.exit(1);
  }

  // Find turfs without admin
  const turfs = await Turf.find({ $or: [{ admin: { $exists: false } }, { admin: null }] });
  console.log(`Found ${turfs.length} turfs without admin`);

  for (const turf of turfs) {
    turf.admin = superadmin._id;
    await turf.save();
    console.log(`Assigned superadmin ${superadmin.email} to turf ${turf._id}`);
  }

  console.log('Backfill complete');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});