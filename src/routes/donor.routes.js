import { Router } from 'express';
import { query, param, body } from 'express-validator';
import { searchDonors, myEligibility, myDonations, updateMe, compatibility } from '../controllers/donorController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { BLOOD_TYPES } from '../utils/bloodLogic.js';

const router = Router();

router.get(
  '/',
  [
    query('bloodType').optional().isIn(BLOOD_TYPES).withMessage('Invalid blood type'),
    query('city').optional().isString().trim().isLength({ max: 60 }),
    query('available').optional().isBoolean().withMessage('available must be true/false'),
    query('compatibleWith').optional().isIn(BLOOD_TYPES).withMessage('Invalid compatibleWith type'),
  ],
  validate,
  searchDonors
);

router.get(
  '/compatibility/:type',
  [param('type').isString().trim().notEmpty()],
  validate,
  compatibility
);

router.get('/eligibility', protect, myEligibility);

// Donation history for the logged-in donor.
router.get('/me/donations', protect, myDonations);

router.patch(
  '/me',
  protect,
  [
    body('available').optional().isBoolean(),
    body('city').optional().isString().trim().isLength({ max: 60 }),
    body('phone').optional().isString().trim().isLength({ min: 8, max: 20 }),
    body('donorStatus').optional().isIn(['active', 'inactive', 'pending']),
  ],
  validate,
  updateMe
);

export default router;