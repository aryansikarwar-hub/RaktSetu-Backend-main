import mongoose from 'mongoose';
import { BLOOD_TYPES } from '../utils/bloodLogic.js';

const donationSchema = new mongoose.Schema(
  {
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hospital: { type: String, trim: true },
    city: { type: String, trim: true },
    bloodType: { type: String, enum: BLOOD_TYPES },
    units: { type: Number, default: 1, min: 1 },
    donationType: {
      type: String,
      enum: ['Whole Blood', 'Platelets', 'Plasma', 'Double Red Cells'],
      default: 'Whole Blood',
    },
    pointsAwarded: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

donationSchema.index({ donor: 1, date: -1 });

export default mongoose.models.Donation || mongoose.model('Donation', donationSchema);
