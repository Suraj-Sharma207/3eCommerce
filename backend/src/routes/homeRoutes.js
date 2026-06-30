import express from 'express';
import { getFeaturedProducts, getTrendingProducts, getNewArrivals, getSpecialOffers, getBestSellers, updateFeaturedOrder, getAllHomeSections } from '../controllers/homeController.js';

const router = express.Router();

router.get('/all', getAllHomeSections);
router.get('/featured', getFeaturedProducts);
router.get('/trending', getTrendingProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/special-offers', getSpecialOffers);
router.get('/best-sellers', getBestSellers);
router.put('/featured/order', updateFeaturedOrder);

export default router;
