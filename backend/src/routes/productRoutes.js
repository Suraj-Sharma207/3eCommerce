import express from 'express';
import productController from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { productSchema } from '../validations/productValidation.js';

const router = express.Router();

// Public routes
router.get('/', productController.getProducts);
router.get('/search/suggestions', productController.getSearchSuggestions);
router.get('/home', productController.getHomeProducts);
router.get('/categories', productController.getCategories);
router.get('/:id/related', productController.getRelatedProducts);
router.post('/:id/notify', productController.notifyStock);
router.get('/:id/notify/status', protect, productController.getNotifyStatus);
router.get('/:id', productController.getProductById);

// Admin routes
router.post('/', protect, authorize('ADMIN'), validate(productSchema), productController.createProduct);
router.put('/:id', protect, authorize('ADMIN'), validate(productSchema), productController.updateProduct);
router.delete('/:id', protect, authorize('ADMIN'), productController.deleteProduct);

export default router;
