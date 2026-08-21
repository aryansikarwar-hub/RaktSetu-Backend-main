import { Router } from 'express';
import authRoutes from './auth.routes.js';
import donorRoutes from './donor.routes.js';
import hospitalRoutes from './hospital.routes.js';
import emergencyRoutes from './emergency.routes.js';
import aiRoutes from './ai.routes.js';
import statsRoutes from './stats.routes.js';
import notificationRoutes from './notification.routes.js';
import bookingRoutes from './booking.routes.js';
import commRoutes from './comm.routes.js';
import commTemplateRoutes from './commTemplate.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/donors', donorRoutes);
router.use('/hospitals', hospitalRoutes);
router.use('/emergencies', emergencyRoutes);
router.use('/ai', aiRoutes);
router.use('/stats', statsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/', bookingRoutes);
router.use('/comm', commRoutes);
router.use('/comm/templates', commTemplateRoutes);

router.get('/', (_req, res) =>
  res.json({ success: true, message: 'RaktSetu API', version: '1.0.0' })
);

export default router;
