import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
  action: { type: String, required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  meta: { type: Object },
}, { timestamps: true });

export default mongoose.model('AuditLog', auditSchema);
