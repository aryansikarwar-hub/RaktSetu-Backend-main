import mongoose from 'mongoose';
import { BLOOD_TYPES } from '../utils/bloodLogic.js';

const emergencyRequestSchema = new mongoose.Schema(
  {
    bloodType: { type: String, enum: BLOOD_TYPES, required: true },
    units: { type: Number, required: true, min: 1, max: 50 },
    urgency: { type: String, enum: ['critical', 'urgent', 'moderate'], default: 'urgent' },

    hospital: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    ward: { type: String, trim: true },

    contactName: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },

    patientAge: { type: Number, min: 0, max: 120 },
    patientGender: { type: String, enum: ['Male', 'Female', 'Other'] },
    reason: { type: String, trim: true },

    // AI triage output
    priorityScore: { type: Number, default: 0 }, // 0-100, higher = handle first
    triageLabel: { type: String, default: '' },
    triageReasons: { type: [String], default: [] },

    status: {
      type: String,
      enum: ['open', 'matched', 'fulfilled', 'expired', 'cancelled'],
      default: 'open',
    },
    respondersCount: { type: Number, default: 0 },
    matchedDonors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

emergencyRequestSchema.index({ status: 1, priorityScore: -1, createdAt: -1 });
emergencyRequestSchema.index({ city: 1, bloodType: 1 });

export default mongoose.models.EmergencyRequest ||
  mongoose.model('EmergencyRequest', emergencyRequestSchema);
