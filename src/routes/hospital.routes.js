import { Router } from 'express';
import { query, param, body } from 'express-validator';
import { listHospitals, getHospital, aggregateInventory, updateInventory } from '../controllers/hospitalController.js';
import { validate } from '../middleware/validate.js';
import { protect, restrictTo } from '../middleware/auth.js';

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

router.put(
  '/:id/inventory',
  protect,
  restrictTo('hospital', 'admin'),
  [param('id').isString().trim().notEmpty(), body('inventory').isArray().withMessage('inventory array required')],
  validate,
  updateInventory
);

export default router;
