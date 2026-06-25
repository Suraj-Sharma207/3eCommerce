import express from 'express';
import userController from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import uploadAvatar from '../middleware/uploadAvatar.js';

const router = express.Router();

router.get('/profile', protect, userController.getProfile);
router.get('/profile/stats', protect, userController.getStats);
router.put('/profile', protect, userController.updateProfile);
router.post('/profile/avatar', protect, uploadAvatar.single('avatar'), userController.uploadAvatar);
router.put('/profile/password', protect, userController.changePassword);

export default router;
