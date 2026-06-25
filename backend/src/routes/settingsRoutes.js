import express from 'express';
import settingsController from '../controllers/settingsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

export default router;
