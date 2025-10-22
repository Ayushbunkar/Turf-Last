import mongoose from "mongoose";

const turfSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String },
    pricePerHour: { type: Number, required: true },
    availableSlots: [
      {
        startTime: String,
        endTime: String,
        isBooked: { type: Boolean, default: false },
      },
    ],
    images: [String],
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
      // Overall status: 'pending' | 'active' | 'blocked' | 'maintenance'
      status: { type: String, enum: ['pending', 'active', 'blocked', 'maintenance'], default: 'pending' },
      // For backwards-compat, keep isApproved for quick checks
      isApproved: { type: Boolean, default: false }, // for SuperAdmin approval
      // If a turf is blocked, store the reason (optional)
      blockReason: { type: String, default: '' },
      lastBlockedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Turf", turfSchema);
