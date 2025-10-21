import mongoose from 'mongoose';

const EmailCampaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  content: { type: String, required: true },
  target: { type: String, default: 'all' },
  scheduledAt: { type: Date },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailTemplate' },
  status: { type: String, enum: ['draft', 'scheduled', 'sent', 'failed'], default: 'draft' },
  recipients: { type: Number, default: 0 },
  openRate: { type: Number, default: 0 },
  clickRate: { type: Number, default: 0 },
  sentAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('EmailCampaign', EmailCampaignSchema);
