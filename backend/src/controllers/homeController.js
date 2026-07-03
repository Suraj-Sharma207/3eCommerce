import homepageService from '../services/homepageService.js';
import { cacheGet, cacheSet, cacheInvalidateByPattern } from '../services/cacheService.js';

// Cache TTL config for home elements
const HOME_CACHE_TTL = 300; // 5 minutes

export const getAllHomeSections = async (req, res, next) => {
  try {
    const cacheKey = 'home:all';
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ success: true, data: cached });

    const data = await homepageService.getHomepageSections();
    await cacheSet(cacheKey, data, HOME_CACHE_TTL);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getFeaturedProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const cacheKey = `home:featured:limit=${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const data = await homepageService.getFeaturedProducts(limit);
    await cacheSet(cacheKey, data, HOME_CACHE_TTL);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getTrendingProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const cacheKey = `home:trending:limit=${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const data = await homepageService.getTrendingProducts(limit);
    await cacheSet(cacheKey, data, HOME_CACHE_TTL);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getNewArrivals = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const cacheKey = `home:new:limit=${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const data = await homepageService.getNewArrivalProducts(limit);
    await cacheSet(cacheKey, data, HOME_CACHE_TTL);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getSpecialOffers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const cacheKey = `home:offers:limit=${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const data = await homepageService.getSpecialOfferProducts(limit);
    await cacheSet(cacheKey, data, HOME_CACHE_TTL);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getBestSellers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const cacheKey = `home:bestsellers:limit=${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const data = await homepageService.getBestSellerProducts(limit);
    await cacheSet(cacheKey, data, HOME_CACHE_TTL);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const updateFeaturedOrder = async (req, res, next) => {
  try {
    const { products } = req.body;
    await homepageService.updateFeaturedOrder(products);
    
    // Invalidate all home cache keys on reordering
    await cacheInvalidateByPattern('home:*');
    
    res.json({ success: true, message: 'Order updated successfully' });
  } catch (error) {
    next(error);
  }
};
