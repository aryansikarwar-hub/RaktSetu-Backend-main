import { Router } from 'express';
import authRoutes from './auth.routes.js';
import donorRoutes from './donor.routes.js';
import hospitalRoutes from './hospital.routes.js';
import emergencyRoutes from './emergency.routes.js';
import aiRoutes from './ai.routes.js';
import statsRoutes from './stats.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/donors', donorRoutes);
router.use('/hospitals', hospitalRoutes);
router.use('/emergencies', emergencyRoutes);
router.use('/ai', aiRoutes);
router.use('/stats', statsRoutes);

router.get('/', (_req, res) =>
  res.json({ success: true, message: 'RaktSetu API', version: '1.0.0' })
);

export default router;
