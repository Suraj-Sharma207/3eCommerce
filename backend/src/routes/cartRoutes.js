import { Router } from 'express';
import cartController from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// All cart routes require authentication
router.use(protect);

router.get('/', cartController.getCart);
router.post('/items', cartController.addToCart);
router.put('/items/:productId', cartController.updateQuantity);
router.delete('/items/:productId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

export default router;
