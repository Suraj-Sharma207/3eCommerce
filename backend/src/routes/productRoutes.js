import express from 'express';
import productController from '../controllers/productController.js';
import productImageController from '../controllers/productImageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { productSchema } from '../validations/productValidation.js';
import uploadProduct from '../middleware/uploadProduct.js';
import multer from 'multer';

const uploadDoc = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = express.Router();

// ── Public routes ───────────────────────────────────────────────────────────
router.get('/', productController.getProducts);
router.get('/search/suggestions', productController.getSearchSuggestions);
router.get('/featured', productController.getFeaturedProducts);
router.get('/trending', productController.getTrendingProducts);
router.get('/new', productController.getNewProducts);
router.get('/best-sellers', productController.getBestSellers);
router.get('/recommended', productController.getRecommendedProductsEndpoint);
router.get('/categories', productController.getCategories);
router.get('/:id/related', productController.getRelatedProducts);
router.post('/:id/notify', productController.notifyStock);
router.get('/:id/notify/status', protect, productController.getNotifyStatus);
router.get('/:id/images', productImageController.getImages);
router.get('/:id', productController.getProductById);

// ── Admin routes ────────────────────────────────────────────────────────────
router.post('/', protect, authorize('ADMIN'), validate(productSchema), productController.createProduct);
router.put('/:id', protect, authorize('ADMIN'), validate(productSchema), productController.updateProduct);
router.delete('/:id', protect, authorize('ADMIN'), productController.deleteProduct);

// Bulk Import routes
router.get('/import-template/csv', protect, authorize('ADMIN'), productController.downloadCsvTemplate);
router.get('/import-template/xlsx', protect, authorize('ADMIN'), productController.downloadExcelTemplate);
router.post('/import-preview', protect, authorize('ADMIN'), uploadDoc.single('file'), productController.importPreview);
router.post('/import-row', protect, authorize('ADMIN'), productController.importRow);

// ── Admin image management routes ───────────────────────────────────────────
router.post(
  '/:id/images',
  protect,
  authorize('ADMIN'),
  uploadProduct.array('images', 10),
  productImageController.uploadImages
);
router.delete(
  '/:id/images/:imageId',
  protect,
  authorize('ADMIN'),
  productImageController.deleteImage
);
router.put(
  '/:id/images/reorder',
  protect,
  authorize('ADMIN'),
  productImageController.reorderImages
);
router.put(
  '/:id/images/:imageId/primary',
  protect,
  authorize('ADMIN'),
  productImageController.setPrimaryImage
);

export default router;
