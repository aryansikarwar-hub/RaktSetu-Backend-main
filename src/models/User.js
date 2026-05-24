import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { BLOOD_TYPES } from '../utils/bloodLogic.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, trim: true },
    role: { type: String, enum: ['donor', 'hospital', 'coordinator', 'admin'], default: 'donor' },

    // Blood type is required only for donors (hospitals/admins don't need one).
    bloodType: {
      type: String,
      enum: BLOOD_TYPES,
      required: function reqBlood() { return this.role === 'donor'; },
    },
    city: { type: String, trim: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },

    // Hospital-account fields (used when role === 'hospital')
    hospitalName: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    designation: { type: String, trim: true },

    donorStatus: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' },
    available: { type: Boolean, default: true },
    lastDonation: { type: Date, default: null },
    totalDonations: { type: Number, default: 0 },

    // Gamification
    points: { type: Number, default: 0 },
    tier: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], default: 'Bronze' },
    badges: { type: [String], default: [] },

    // Reliability score (0-100) used by the AI match engine
    reliability: { type: Number, default: 80, min: 0, max: 100 },

    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ location: '2dsphere' });
userSchema.index({ bloodType: 1, city: 1, available: 1 });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.models.User || mongoose.model('User', userSchema);
