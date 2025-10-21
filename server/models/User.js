import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // Optional contact fields
    phone: { type: String },
    address: { type: String },
    // Administrative/status fields
    status: { type: String, enum: ['active', 'pending', 'blocked', 'suspended'], default: 'pending' },
    role: {
      type: String,
      enum: ["user", "Turfadmin", "superadmin"],
      default: "user",
    },
    // Basic metrics (optional)
    turfsCount: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    growth: { type: Number, default: 0 },
  // Per-user settings/preferences
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
