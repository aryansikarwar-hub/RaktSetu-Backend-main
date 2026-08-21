import mongoose from 'mongoose';

const commJobSchema = new mongoose.Schema({
  type: { type: String, enum: ['sms', 'email', 'whatsapp'], required: true },
  to: { type: String, required: true },
  vars: { type: mongoose.Schema.Types.Mixed, default: {} },
  subject: { type: String },
  body: { type: String },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  status: { type: String, enum: ['pending', 'sending', 'success', 'failed'], default: 'pending' },
  lastError: { type: String },
  nextAttemptAt: { type: Date, default: Date.now },
}, { timestamps: true });

commJobSchema.index({ status: 1, nextAttemptAt: 1 });

export default mongoose.models.CommJob || mongoose.model('CommJob', commJobSchema);
