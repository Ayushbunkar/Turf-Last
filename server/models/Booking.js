import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    turf: { type: mongoose.Schema.Types.ObjectId, ref: "Turf", required: true },
  // support single or multi-hour bookings via an array of slots
  slots: [{ startTime: String, endTime: String }],
    date: { type: String, required: true },
    price: { type: Number, required: true },
      // allow 'pending' -> 'paid' lifecycle
      status: { type: String, enum: ["pending", "confirmed", "paid", "cancelled"], default: "pending" },
      // payment information stored on verification
      payment: {
        amount: { type: Number },
        method: { type: String },
        transactionId: { type: String },
        providerOrderId: { type: String },
        providerPaymentId: { type: String },
        signature: { type: String },
        status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
        date: { type: Date }
      }
  },
  { timestamps: true }
);

// TTL index: remove pending bookings after 15 minutes to avoid indefinite reservations
// Only applies to documents where status is 'pending'
const pendingTTL = Number(process.env.PENDING_BOOKING_TTL) || 900; // seconds
// TTL index: remove pending bookings after `pendingTTL` seconds to avoid indefinite reservations
bookingSchema.index({ createdAt: 1 }, { expireAfterSeconds: pendingTTL, partialFilterExpression: { status: 'pending' } });

export default mongoose.model("Booking", bookingSchema);
