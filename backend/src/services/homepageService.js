import prisma from '../lib/prisma.js';
import promotionService from './promotionService.js';
import { mapProducts } from '../utils/productMapper.js';

class HomepageService {
  async processPromotions(products) {
    const activePromotions = await promotionService.getActivePromotions();
    return Promise.all(products.map(async (product) => {
      const { finalPrice, discountPercentage } = await promotionService.calculateProductPrice(product, activePromotions);
      return { ...product, finalPrice, discountPercentage };
    }));
  }

  async getFeaturedProducts(limit = 8) {
    const products = await prisma.product.findMany({
      where: { active: true, featured: true },
      orderBy: { homepageOrder: 'asc' },
      take: limit,
      include: { images: { orderBy: { displayOrder: 'asc' } } }
    });

    const mappedProducts = mapProducts(products);
    return await this.processPromotions(mappedProducts);
  }

  async getTrendingProducts(limit = 8) {
    const products = await prisma.product.findMany({
      where: { active: true },
      include: { images: { orderBy: { displayOrder: 'asc' } } }
    });

    const mappedProducts = mapProducts(products);
    let scoredProducts = mappedProducts.map(p => ({
      ...p,
      // Trending Score = (totalViews × 0.35) + (wishlistCount × 0.25) + (cartCount × 0.20) + (totalSold × 0.20)
      trendingScore: (0.35 * (p.totalViews || 0)) + (0.25 * (p.wishlistCount || 0)) + (0.20 * (p.cartCount || 0)) + (0.20 * (p.totalSold || 0))
    }));

    const maxScore = Math.max(...scoredProducts.map(p => p.trendingScore));
    if (maxScore === 0) {
      scoredProducts = scoredProducts.filter(p => p.trending);
    } else {
      scoredProducts.sort((a, b) => b.trendingScore - a.trendingScore);
      // Pinned trending products could be placed first if needed, but the ranking should be dynamic
      // If we want pinned products first:
      scoredProducts.sort((a, b) => {
        if (a.trending && !b.trending) return -1;
        if (!a.trending && b.trending) return 1;
        return 0; // maintain dynamic order within same pinned state
      });
    }

    const topProducts = scoredProducts.slice(0, limit).map(({ trendingScore, ...p }) => p);
    return await this.processPromotions(topProducts);
  }

  async getNewArrivalProducts(limit = 8) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      include: { images: { orderBy: { displayOrder: 'asc' } } }
    });

    const mappedProducts = mapProducts(products);
    const sorted = mappedProducts.sort((a, b) => {
      const aIsNew = a.newArrival && a.createdAt >= thirtyDaysAgo ? 1 : 0;
      const bIsNew = b.newArrival && b.createdAt >= thirtyDaysAgo ? 1 : 0;
      if (aIsNew !== bIsNew) {
        return bIsNew - aIsNew;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    }).slice(0, limit);

    return await this.processPromotions(sorted);
  }

  async getSpecialOfferProducts(limit = 8) {
    const products = await prisma.product.findMany({
      where: { active: true },
      include: { images: { orderBy: { displayOrder: 'asc' } } }
    });

    const mappedProducts = mapProducts(products);
    const processed = await this.processPromotions(mappedProducts);

    // Special Offers: salePrice < price OR discountPercentage > 0 OR active promotion exists OR campaign discount OR computed finalPrice < original price
    const offers = processed.filter(p => p.discountPercentage > 0 || p.finalPrice < p.price);

    offers.sort((a, b) => {
      if (b.discountPercentage !== a.discountPercentage) return b.discountPercentage - a.discountPercentage;
      if (b.totalSold !== a.totalSold) return b.totalSold - a.totalSold;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return offers.slice(0, limit);
  }

  async getBestSellerProducts(limit = 8) {
    const products = await prisma.product.findMany({
      where: { active: true, totalSold: { gt: 0 } },
      orderBy: [
        { totalSold: 'desc' },
        { lastPurchasedAt: 'desc' },
        { rating: 'desc' }
      ],
      take: limit,
      include: { images: { orderBy: { displayOrder: 'asc' } } }
    });

    // If we don't have enough best sellers that are > 0, fallback to just any best sellers
    let allProducts = products;
    if (products.length === 0) {
        allProducts = await prisma.product.findMany({
            where: { active: true, bestSeller: true },
            take: limit,
            include: { images: { orderBy: { displayOrder: 'asc' } } }
        });
    }

    const mappedProducts = mapProducts(allProducts);
    return await this.processPromotions(mappedProducts);
  }

  async getHomepageSections(limits = { featured: 8, trending: 8, newArrivals: 8, specialOffers: 8, bestSellers: 8 }) {
    const [
      featuredCollection,
      trending,
      newArrivals,
      specialOffers,
      bestSellers
    ] = await Promise.all([
      this.getFeaturedProducts(limits.featured),
      this.getTrendingProducts(limits.trending),
      this.getNewArrivalProducts(limits.newArrivals),
      this.getSpecialOfferProducts(limits.specialOffers),
      this.getBestSellerProducts(limits.bestSellers)
    ]);

    return {
      featuredCollection: featuredCollection || [],
      trending: trending || [],
      newArrivals: newArrivals || [],
      specialOffers: specialOffers || [],
      bestSellers: bestSellers || []
    };
  }

  async updateFeaturedOrder(products) {
    if (!Array.isArray(products)) {
      throw { status: 400, message: 'Invalid data format' };
    }

    await prisma.$transaction(
      products.map(p =>
        prisma.product.update({
          where: { id: p.id },
          data: { homepageOrder: p.homepageOrder }
        })
      )
    );
  }
}

export default new HomepageService();
