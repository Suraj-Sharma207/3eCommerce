import express from 'express';
import settingsController from '../controllers/settingsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public Config
router.get('/public', settingsController.getPublicConfig);

// Protected Admin Routes
router.use(protect);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/email/preview', settingsController.getEmailPreview);

// Domain specific routes
router.get('/store', settingsController.getStore);
router.put('/store', settingsController.updateStore);

router.get('/shipping', settingsController.getShipping);
router.put('/shipping', settingsController.updateShipping);

router.get('/payment', settingsController.getPayment);
router.put('/payment', settingsController.updatePayment);

router.get('/smtp', settingsController.getSmtp);
router.put('/smtp', settingsController.updateSmtp);
router.post('/smtp/test', settingsController.testSmtp);
router.post('/smtp/diagnostics', settingsController.diagnosticSmtp);

router.get('/security', settingsController.getSecurity);
router.put('/security', settingsController.updateSecurity);

router.get('/notifications', settingsController.getNotifications);
router.put('/notifications', settingsController.updateNotifications);

export default router;
