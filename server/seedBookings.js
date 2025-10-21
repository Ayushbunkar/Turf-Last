import mongoose from 'mongoose';
import Booking from './models/Booking.js';

// Replace with your MongoDB connection string
const MONGO_URI = 'mongodb://127.0.0.1:27017/turfdb';

async function seedBookings() {
  await mongoose.connect(MONGO_URI);

  // Example turf and user IDs (replace with real ones from your DB)
  const turfIds = [
    '68efde92fa50151aac484ed9',
    '68ee041307659451b61a1561',
    '68ee040c07659451b61a155d',
    '68ee06ed53223472d785375c',
    '68ee065607659451b61a1574',
    '68ee059f07659451b61a1570',
    '68ee042e07659451b61a1565'
  ];
  const userId = 'YOUR_USER_ID_HERE'; // Replace with a valid user _id

  const bookings = turfIds.map((turfId, i) => ({
    turf: turfId,
    user: userId,
    price: 1000 + i * 500,
    status: 'confirmed',
    createdAt: new Date(Date.now() - i * 86400000)
  }));

  await Booking.insertMany(bookings);
  console.log('Sample bookings added!');
  await mongoose.disconnect();
}

seedBookings().catch(console.error);
