import prisma from '../lib/prisma.js';
import promotionService from '../services/promotionService.js';

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

const processPromotions = async (products) => {
  const activePromotions = await promotionService.getActivePromotions();
  return Promise.all(products.map(async (product) => {
    const { finalPrice, discountPercentage } = await promotionService.calculateProductPrice(product, activePromotions);
    return { ...product, finalPrice, discountPercentage };
  }));
};

export const getFeaturedProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const cacheKey = `home_featured_${limit}`;
    const cached = homeCache.get(cacheKey);
    if (cached) return res.json(cached);

    const products = await prisma.product.findMany({
      where: { active: true, featured: true },
      orderBy: { homepageOrder: 'asc' },
      take: limit,
      include: { images: true }
    });

    const processed = await processPromotions(products);
    homeCache.set(cacheKey, processed);
    res.json(processed);
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

    const products = await prisma.product.findMany({
      where: { active: true },
      include: { images: true }
    });

    let scoredProducts = products.map(p => ({
      ...p,
      trendingScore: (0.50 * p.totalSold) + (0.25 * p.totalViews) + (0.15 * p.wishlistCount) + (0.10 * p.cartCount)
    }));

    const maxScore = Math.max(...scoredProducts.map(p => p.trendingScore));
    if (maxScore === 0) {
      scoredProducts = scoredProducts.filter(p => p.trending);
    } else {
      scoredProducts.sort((a, b) => b.trendingScore - a.trendingScore);
    }

    const topProducts = scoredProducts.slice(0, limit).map(({ trendingScore, ...p }) => p);
    
    const processed = await processPromotions(topProducts);
    homeCache.set(cacheKey, processed);
    res.json(processed);
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

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      include: { images: true }
    });

    const sorted = products.sort((a, b) => {
      const aIsNew = a.newArrival && a.createdAt >= thirtyDaysAgo ? 1 : 0;
      const bIsNew = b.newArrival && b.createdAt >= thirtyDaysAgo ? 1 : 0;
      if (aIsNew !== bIsNew) {
        return bIsNew - aIsNew;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    }).slice(0, limit);

    const processed = await processPromotions(sorted);
    homeCache.set(cacheKey, processed);
    res.json(processed);
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

    const products = await prisma.product.findMany({
      where: { active: true },
      include: { images: true }
    });

    const processed = await processPromotions(products);

    const offers = processed.filter(p => p.discountPercentage > 0 || p.finalPrice < p.price);

    offers.sort((a, b) => {
      if (b.discountPercentage !== a.discountPercentage) return b.discountPercentage - a.discountPercentage;
      if (b.totalSold !== a.totalSold) return b.totalSold - a.totalSold;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const topOffers = offers.slice(0, limit);
    homeCache.set(cacheKey, topOffers);
    res.json(topOffers);
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

    const products = await prisma.product.findMany({
      where: { active: true, totalSold: { gt: 0 } },
      orderBy: [
        { totalSold: 'desc' },
        { totalRevenue: 'desc' },
        { lastPurchasedAt: 'desc' }
      ],
      take: limit,
      include: { images: true }
    });

    const processed = await processPromotions(products);
    homeCache.set(cacheKey, processed);
    res.json(processed);
  } catch (error) {
    next(error);
  }
};

export const updateFeaturedOrder = async (req, res, next) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ success: false, message: 'Invalid data format' });
    }

    await prisma.$transaction(
      products.map(p =>
        prisma.product.update({
          where: { id: p.id },
          data: { homepageOrder: p.homepageOrder }
        })
      )
    );

    homeCache.clear();
    res.json({ success: true, message: 'Order updated successfully' });
  } catch (error) {
    next(error);
  }
};
