import { Router } from 'express';
import { query, param } from 'express-validator';
import { listHospitals, getHospital, aggregateInventory } from '../controllers/hospitalController.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get(
  '/',
  [query('city').optional().isString().trim().isLength({ max: 60 })],
  validate,
  listHospitals
);

router.get(
  '/inventory/aggregate',
  [query('city').optional().isString().trim().isLength({ max: 60 })],
  validate,
  aggregateInventory
);

router.get(
  '/:id',
  [param('id').isString().trim().notEmpty().withMessage('Hospital id required')],
  validate,
  getHospital
);

export default router;
