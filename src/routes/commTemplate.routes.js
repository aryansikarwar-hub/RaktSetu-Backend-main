import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import ctrl from '../controllers/commTemplateController.js';
import jobCtrl from '../controllers/commJobController.js';

const router = Router();

// Admin/coordinator only
router.use(protect, restrictTo('admin', 'coordinator'));

router.get('/', ctrl.listTemplates);
router.get('/jobs', jobCtrl.listJobs);
router.post('/jobs', jobCtrl.createJob);
router.post('/', ctrl.createTemplate);
router.get('/audits', ctrl.listAudits);
router.get('/:id', ctrl.getTemplate);
router.put('/:id', ctrl.updateTemplate);
router.delete('/:id', ctrl.deleteTemplate);
router.post('/jobs/:id/retry', jobCtrl.retryJob);

export default router;
