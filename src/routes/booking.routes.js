import { Router } from 'express';
import { createBooking, listBookingsForHospital, listBookingsForDonor, cancelBooking } from '../controllers/bookingController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Hospital endpoints
router.get('/hospitals/:id/bookings', protect, listBookingsForHospital);
router.post('/hospitals/:id/book', protect, createBooking);

// Donor endpoints
router.get('/donors/me/bookings', protect, listBookingsForDonor);
router.post('/bookings/:id/cancel', protect, cancelBooking);

export default router;
