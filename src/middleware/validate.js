import { validationResult } from 'express-validator';

/**
 * Centralised validation handler. Place AFTER a route's validation chain:
 *   router.post('/', [body('x').notEmpty()], validate, controller)
 * Returns a clean 422 with field-level errors so the frontend can show them.
 */
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const formatted = errors.array().map((e) => ({
    field: e.path || e.param,
    message: e.msg,
  }));
  return res.status(422).json({
    success: false,
    message: 'Validation failed',
    errors: formatted,
  });
}
