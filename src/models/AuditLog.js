import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  target: { type: String, required: true },
  targetId: { type: String },
  data: { type: Object },
}, { timestamps: true });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', auditSchema);
