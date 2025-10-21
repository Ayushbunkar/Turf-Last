import mongoose from 'mongoose';

const EmailTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, default: 'general' },
  usage: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('EmailTemplate', EmailTemplateSchema);
