import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, me } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { BLOOD_TYPES } from '../utils/bloodLogic.js';

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters'),
    body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
      .matches(/[A-Za-z]/).withMessage('Password must contain a letter')
      .matches(/\d/).withMessage('Password must contain a number'),
    body('role').optional().isIn(['donor', 'hospital', 'admin']).withMessage('Invalid role'),
    body('phone').trim().notEmpty().withMessage('Mobile number is required')
      // Strip spaces/dashes before checking so "+91 98765 43210" and "9876543210" both pass.
      .customSanitizer((v) => String(v).replace(/[^\d+]/g, ''))
      .matches(/^(?:\+?91|0)?[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
    body('city').trim().notEmpty().withMessage('City is required'),
    // Donor-only
    body('bloodType').if(body('role').not().equals('hospital')).if(body('role').not().equals('admin'))
      .isIn(BLOOD_TYPES).withMessage('Select a valid blood type'),
    // Hospital-only
    body('hospitalName').if(body('role').equals('hospital'))
      .trim().notEmpty().withMessage('Hospital name is required'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.get('/me', protect, me);

export default router;