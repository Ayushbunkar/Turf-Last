import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
  action: { type: String, required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // common target fields for different domain objects
  targetBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  targetTurf: { type: mongoose.Schema.Types.ObjectId, ref: 'Turf' },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // snapshot of actor info at time of action to avoid relying on population later
  actorSnapshot: { type: Object },
  meta: { type: Object },
}, { timestamps: true });

export default mongoose.model('AuditLog', auditSchema);
