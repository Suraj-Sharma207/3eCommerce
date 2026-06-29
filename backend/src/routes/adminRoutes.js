import { Router } from 'express';
import adminController from '../controllers/adminController.js';
import userController from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import uploadAvatar from '../middleware/uploadAvatar.js';

import { updateBranding, uploadLogo, uploadEmailLogo } from '../controllers/brandingController.js';
import uploadBranding from '../middleware/uploadBranding.js';

const router = Router();

// All other admin routes are protected and require ADMIN role
router.use(protect);
router.use(authorize('ADMIN'));

// Branding management
router.put('/branding', updateBranding);
router.post('/branding/logo', uploadBranding.single('logo'), uploadLogo);
router.post('/branding/email-logo', uploadBranding.single('emailLogo'), uploadEmailLogo);

router.get('/dashboard', adminController.getDashboardAnalytics);
router.get('/dashboard/revenue', adminController.getRevenueAnalytics);
router.get('/dashboard/inventory-alerts', adminController.getInventoryAlerts);
router.get('/dashboard/orders', adminController.getOrdersAnalytics);
router.get('/dashboard/customers', adminController.getCustomersAnalytics);
router.get('/dashboard/products', adminController.getProductsAnalytics);
router.get('/dashboard/deliveries', adminController.getDeliveriesAnalytics);
router.get('/dashboard/cancellations', adminController.getCancellationsAnalytics);
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:id/status', adminController.updateOrderStatus);

router.post('/profile/avatar', uploadAvatar.single('avatar'), userController.uploadAvatar);

router.get('/customers', adminController.getAllCustomers);
router.get('/customers/:id', adminController.getCustomerById);
router.put('/customers/:id/status', adminController.updateCustomerStatus);

// Temporary test endpoint
router.get('/test-admin', (req, res) => {
  res.json({ user: req.user });
});

export default router;
