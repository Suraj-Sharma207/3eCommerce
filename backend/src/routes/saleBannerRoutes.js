import { Router } from 'express';
import { getActiveBanner } from '../controllers/saleBannerController.js';

const router = Router();

router.get('/', getActiveBanner);

export default router;
