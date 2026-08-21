import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    slotAt: { type: Date, required: true },
    units: { type: Number, default: 1, min: 1 },
    status: { type: String, enum: ['booked', 'cancelled', 'completed'], default: 'booked' },
    notes: { type: String },
  },
  { timestamps: true }
);

bookingSchema.index({ hospital: 1, slotAt: 1 });

export default mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
