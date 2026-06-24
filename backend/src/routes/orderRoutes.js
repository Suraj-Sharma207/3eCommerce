import { Router } from 'express';
import orderController from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.post('/checkout', orderController.checkout);
router.get('/', orderController.getUserOrders);
router.get('/:id', orderController.getOrderById);

export default router;
