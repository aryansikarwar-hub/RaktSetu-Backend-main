import mongoose from 'mongoose';
import { BLOOD_TYPES } from '../utils/bloodLogic.js';

const inventorySchema = new mongoose.Schema(
  {
    bloodType: { type: String, enum: BLOOD_TYPES, required: true },
    units: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    beds: { type: Number, default: 0 },
    hasBloodBank: { type: Boolean, default: true },
    verified: { type: Boolean, default: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    inventory: { type: [inventorySchema], default: [] },
  },
  { timestamps: true }
);

hospitalSchema.index({ location: '2dsphere' });
hospitalSchema.index({ city: 1 });

export default mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema);
