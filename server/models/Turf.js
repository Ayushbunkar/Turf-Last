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
    isApproved: { type: Boolean, default: false }, // for SuperAdmin approval
  },
  { timestamps: true }
);

export default mongoose.model("Turf", turfSchema);
