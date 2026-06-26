import prisma from '../lib/prisma.js';

class PromotionService {
  async getActivePromotions() {
    try {
      if (!prisma.promotion) {
        console.warn('[PromotionService] prisma.promotion is undefined. Promotions are unavailable.');
        return [];
      }
      
      const now = new Date();
      
      // Fetch all ENABLED promotions where current date is within start/end dates
      // Sorted by priority (highest first)
      return await prisma.promotion.findMany({
        where: {
          status: 'ENABLED',
          startDate: { lte: now },
          endDate: { gte: now }
        },
        include: {
          products: true,
          categories: true,
          brands: true
        },
        orderBy: {
          priority: 'desc'
        }
      });
    } catch (error) {
      console.error('[PromotionService] Error fetching active promotions:', error);
      return [];
    }
  }

  // Calculate product price based on active promotions
  async calculateProductPrice(product, activePromotions) {
    if (!product) return null;
    
    let finalPrice = product.price;
    let appliedDiscount = product.discountPercentage || 0;
    
    if (appliedDiscount > 0) {
      finalPrice = product.price - (product.price * appliedDiscount / 100);
    }
    
    // Evaluate promotions from highest to lowest priority
    for (const promo of activePromotions) {
      const isApplicable = this.isPromotionApplicableToProduct(promo, product);
      
      if (isApplicable) {
        if (promo.type === 'PERCENTAGE_DISCOUNT') {
          const discountAmount = (product.price * promo.discountValue) / 100;
          finalPrice = product.price - discountAmount;
          appliedDiscount = promo.discountValue;
        } else if (promo.type === 'FLAT_DISCOUNT') {
          finalPrice = product.price - promo.discountValue;
          appliedDiscount = Math.round((promo.discountValue / product.price) * 100);
        }
        
        break; // Conflict prevention: apply only the first match
      }
    }
    
    return {
      finalPrice: Math.max(0, finalPrice),
      discountPercentage: appliedDiscount
    };
  }

  isPromotionApplicableToProduct(promo, product) {
    if (promo.applyTo === 'STORE') return true;
    
    if (promo.applyTo === 'PRODUCT') {
      return promo.products.some(p => p.productId === product.id);
    }
    
    if (promo.applyTo === 'CATEGORY') {
      return promo.categories.some(c => c.category === product.category);
    }
    
    if (promo.applyTo === 'BRAND') {
      return promo.brands.some(b => b.brand === product.brand);
    }
    
    return false;
  }
}

export default new PromotionService();
