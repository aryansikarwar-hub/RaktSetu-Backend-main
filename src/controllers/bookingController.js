import { asyncHandler } from '../middleware/error.js';
import { repo } from '../services/repository.js';

/** POST /api/hospitals/:id/book — donor books a slot at hospital */
export const createBooking = asyncHandler(async (req, res) => {
  const hospitalId = req.params.id;
  const donorId = req.user && (req.user._id || req.user.id);
  if (!donorId) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const { slotAt, units = 1, notes } = req.body;
  const data = { hospital: hospitalId, donor: donorId, slotAt: new Date(slotAt), units, notes };
  const booking = await repo.createBooking(data);
  res.status(201).json({ success: true, booking });
});

/** GET /api/hospitals/:id/bookings — list bookings for a hospital (protected) */
export const listBookingsForHospital = asyncHandler(async (req, res) => {
  const hospitalId = req.params.id;
  const list = await repo.listBookingsForHospital(hospitalId);
  res.json({ success: true, count: list.length, bookings: list });
});

/** GET /api/donors/me/bookings — donor's bookings */
export const listBookingsForDonor = asyncHandler(async (req, res) => {
  const donorId = req.user && (req.user._id || req.user.id);
  if (!donorId) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const list = await repo.listBookingsForDonor(donorId);
  res.json({ success: true, count: list.length, bookings: list });
});

/** POST /api/bookings/:id/cancel — cancel a booking (donor or hospital) */
export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await repo.updateBooking(req.params.id, { status: 'cancelled' });
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  res.json({ success: true, booking });
});
