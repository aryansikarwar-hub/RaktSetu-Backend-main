import { Router } from 'express';
import commCtrl from '../controllers/commController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Protected test endpoint to verify SMS/email plumbing (admin or coordinator recommended)
router.post('/test', protect, commCtrl.testSend);

export default router;
