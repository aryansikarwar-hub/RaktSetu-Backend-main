import mongoose from 'mongoose';

const commTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  channel: { type: String, enum: ['sms', 'email', 'whatsapp'], required: true },
  subject: { type: String, default: '' },
  body: { type: String, required: true },
  default: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.CommTemplate || mongoose.model('CommTemplate', commTemplateSchema);
