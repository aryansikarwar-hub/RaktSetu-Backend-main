import { Router } from 'express';
import { body } from 'express-validator';
import { listEmergencies, createEmergency, matchDonors, respond } from '../controllers/emergencyController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { BLOOD_TYPES } from '../utils/bloodLogic.js';

const router = Router();

// Anyone (incl. donors & public) can VIEW the live emergency feed.
router.get('/', listEmergencies);

// Only hospitals & admins can POST a new emergency request.
router.post(
  '/',
  protect,
  restrictTo('hospital', 'admin'),
  [
    body('bloodType').isIn(BLOOD_TYPES).withMessage('Valid blood type required'),
    body('units').isInt({ min: 1, max: 50 }).withMessage('Units must be 1–50'),
    body('hospital').trim().notEmpty().withMessage('Hospital is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('contactName').trim().notEmpty().withMessage('Contact name required'),
    body('contactPhone').trim().notEmpty().withMessage('Contact phone required'),
  ],
  createEmergency
);

router.get('/:id/matches', matchDonors);

// Donors respond to emergencies (must be logged in).
router.post('/:id/respond', protect, respond);

export default router;