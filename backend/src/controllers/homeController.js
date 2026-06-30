import homepageService from '../services/homepageService.js';

class Cache {
  constructor() {
    this.store = new Map();
  }
  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }
  set(key, value, ttlSeconds = 300) {
    this.store.set(key, {
      value,
      expiry: Date.now() + (ttlSeconds * 1000)
    });
  }
  clear() {
    this.store.clear();
  }
}
export const homeCache = new Cache();

export const getAllHomeSections = async (req, res, next) => {
  try {
    const cacheKey = `home_all`;
    const cached = homeCache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached });

    const data = await homepageService.getHomepageSections();
    
    homeCache.set(cacheKey, data);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getFeaturedProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const cacheKey = `home_featured_${limit}`;
    const cached = homeCache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = await homepageService.getFeaturedProducts(limit);
    homeCache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getTrendingProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const cacheKey = `home_trending_${limit}`;
    const cached = homeCache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = await homepageService.getTrendingProducts(limit);
    homeCache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getNewArrivals = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const cacheKey = `home_new_${limit}`;
    const cached = homeCache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = await homepageService.getNewArrivalProducts(limit);
    homeCache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getSpecialOffers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const cacheKey = `home_offers_${limit}`;
    const cached = homeCache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = await homepageService.getSpecialOfferProducts(limit);
    homeCache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getBestSellers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const cacheKey = `home_bestsellers_${limit}`;
    const cached = homeCache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = await homepageService.getBestSellerProducts(limit);
    homeCache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const updateFeaturedOrder = async (req, res, next) => {
  try {
    const { products } = req.body;
    await homepageService.updateFeaturedOrder(products);
    homeCache.clear();
    res.json({ success: true, message: 'Order updated successfully' });
  } catch (error) {
    next(error);
  }
};
