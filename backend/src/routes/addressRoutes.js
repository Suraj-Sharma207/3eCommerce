import express from 'express';
import addressController from '../controllers/addressController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { addressSchema } from '../validations/addressValidation.js';

const router = express.Router();

router.get('/', protect, addressController.getUserAddresses);
router.post('/', protect, validate(addressSchema), addressController.createAddress);
router.put('/:id', protect, validate(addressSchema), addressController.updateAddress);
router.delete('/:id', protect, addressController.deleteAddress);

export default router;
