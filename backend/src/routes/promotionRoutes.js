import express from 'express';
import promotionController from '../controllers/promotionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/', promotionController.getPromotions);
router.post('/', promotionController.createPromotion);
router.put('/:id', promotionController.updatePromotion);
router.delete('/:id', promotionController.deletePromotion);

export default router;
