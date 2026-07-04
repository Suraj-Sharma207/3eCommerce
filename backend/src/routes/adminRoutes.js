import { Router } from 'express';
import adminController from '../controllers/adminController.js';
import userController from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import uploadAvatar from '../middleware/uploadAvatar.js';

import { updateBranding, uploadLogo, uploadEmailLogo } from '../controllers/brandingController.js';
import uploadBranding from '../middleware/uploadBranding.js';
import { createBanner, updateBanner, deleteBanner, getAllBanners } from '../controllers/saleBannerController.js';
import { createShopBanner, updateShopBanner, deleteShopBanner, getAllShopBanners } from '../controllers/shopBannerController.js';
import uploadSaleBanner from '../middleware/uploadSaleBanner.js';

const router = Router();

// All other admin routes are protected and require ADMIN role
router.use(protect);
router.use(authorize('ADMIN'));

// Branding management
router.put('/branding', updateBranding);
router.post('/branding/logo', uploadBranding.single('logo'), uploadLogo);
router.post('/branding/email-logo', uploadBranding.single('emailLogo'), uploadEmailLogo);

router.get('/dashboard', adminController.getDashboardAnalytics);
router.get('/dashboard/kpis', adminController.getKpis);
router.get('/dashboard/recent-orders', adminController.getRecentOrders);
router.get('/dashboard/top-products', adminController.getTopProducts);
router.get('/dashboard/order-statuses', adminController.getOrderStatuses);
router.get('/dashboard/extended-stats', adminController.getExtendedStats);
router.get('/dashboard/revenue', adminController.getRevenueAnalytics);
router.get('/dashboard/inventory-alerts', adminController.getInventoryAlerts);
router.get('/dashboard/orders', adminController.getOrdersAnalytics);
router.get('/dashboard/customers', adminController.getCustomersAnalytics);
router.get('/dashboard/products', adminController.getProductsAnalytics);
router.get('/products', adminController.getAllProducts);
// Bulk selection support — must come before any /:id catch-alls
router.get('/products/ids', adminController.getFilteredProductIds);
router.delete('/products/bulk', adminController.bulkDeleteProducts);
router.get('/dashboard/deliveries', adminController.getDeliveriesAnalytics);
router.get('/dashboard/cancellations', adminController.getCancellationsAnalytics);
router.get('/orders', adminController.getAllOrders);
router.get('/orders/:id', adminController.getOrderById);
router.put('/orders/:id/status', adminController.updateOrderStatus);

router.post('/profile/avatar', uploadAvatar.single('avatar'), userController.uploadAvatar);

// Sale Banner management
router.get('/sale-banner', getAllBanners);
router.post('/sale-banner', uploadSaleBanner.single('image'), createBanner);
router.put('/sale-banner/:id', uploadSaleBanner.single('image'), updateBanner);
router.delete('/sale-banner/:id', deleteBanner);

// Shop Banner management
router.get('/shop-banner', getAllShopBanners);
router.post('/shop-banner', uploadSaleBanner.single('image'), createShopBanner);
router.put('/shop-banner/:id', uploadSaleBanner.single('image'), updateShopBanner);
router.delete('/shop-banner/:id', deleteShopBanner);

router.get('/customers', adminController.getAllCustomers);
router.get('/customers/:id', adminController.getCustomerById);
router.put('/customers/:id/status', adminController.updateCustomerStatus);

export default router;
