import { Router } from 'express';
import { listNotifications, markRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, listNotifications);
router.post('/:id/read', protect, markRead);

export default router;
