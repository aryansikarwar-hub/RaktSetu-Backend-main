import { Router } from 'express';
import { body, query } from 'express-validator';
import { screenEligibility, forecast, matchAdhoc, status, chat, chatSuggestions } from '../controllers/aiController.js';
import { validate } from '../middleware/validate.js';
import { BLOOD_TYPES } from '../utils/bloodLogic.js';

const router = Router();

router.get('/status', status);

router.post(
  '/eligibility',
  [
    body('age').optional({ checkFalsy: true }).isInt({ min: 1, max: 120 }).withMessage('Age must be 1–120'),
    body('weightKg').optional({ checkFalsy: true }).isFloat({ min: 1, max: 400 }).withMessage('Enter a valid weight'),
    body('recentDonationDays').optional({ checkFalsy: true }).isInt({ min: 0, max: 3650 }),
  ],
  validate,
  screenEligibility
);

router.get(
  '/forecast',
  [query('city').optional().isString().trim().isLength({ max: 60 })],
  validate,
  forecast
);

router.post(
  '/match',
  [
    body('bloodType').isIn(BLOOD_TYPES).withMessage('Valid blood type is required'),
    body('city').optional().isString().trim().isLength({ max: 60 }),
    body('urgency').optional().isIn(['critical', 'urgent', 'moderate']),
  ],
  validate,
  matchAdhoc
);

router.get('/chat/suggestions', chatSuggestions);

router.post(
  '/chat',
  [body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 500 }).withMessage('Message too long')],
  validate,
  chat
);

export default router;
