import productService from '../services/productService.js';
import { successResponse, errorResponse } from '../utils/response.js';

class ProductController {
  async getProducts(req, res, next) {
    try {
      const { page, limit, search, category, brand, minRating, minPrice, maxPrice, inStock, stockStatus, sort, featured, trending, newArrival, bestSeller, recommended, sale, includeInventoryCounts } = req.query;
      const data = await productService.getProducts({ page, limit, search, category, brand, minRating, minPrice, maxPrice, inStock, stockStatus, sort, featured, trending, newArrival, bestSeller, recommended, sale, includeInventoryCounts });
      return successResponse(res, 'Products retrieved successfully', data, 200);
    } catch (error) {
      next(error);
    }
  }

  async getSearchSuggestions(req, res, next) {
    try {
      const { q } = req.query;
      if (!q) return successResponse(res, 'Suggestions retrieved', { suggestions: [] }, 200);
      
      // Use productService to get products matching the query
      const data = await productService.getProducts({ search: q, limit: 5 });
      const suggestions = data.products.map(p => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        thumbnail: p.thumbnail,
        category: p.category,
        finalPrice: p.finalPrice || p.price
      }));
      
      return successResponse(res, 'Suggestions retrieved successfully', { suggestions }, 200);
    } catch (error) {
      next(error);
    }
  }

  async getHomeProducts(req, res, next) {
    try {
      // Optimized parallel fetching for homepage sections
      let [featured, trending, newArrivals, bestSellers, sale] = await Promise.all([
        productService.getProducts({ featured: 'true', limit: 8 }),
        productService.getProducts({ trending: 'true', limit: 8 }),
        productService.getProducts({ newArrival: 'true', limit: 8 }),
        productService.getProducts({ bestSeller: 'true', limit: 8 }),
        productService.getProducts({ sale: 'true', limit: 8 })
      ]);

      // Fallbacks if any section is empty
      if (!featured.products || featured.products.length === 0) {
        featured = await productService.getProducts({ limit: 8, sort: 'newest' });
      }
      if (!trending.products || trending.products.length === 0) {
        trending = await productService.getProducts({ limit: 8, sort: 'popular' });
      }
      if (!newArrivals.products || newArrivals.products.length === 0) {
        newArrivals = await productService.getProducts({ limit: 8, sort: 'newest' });
      }
      if (!bestSellers.products || bestSellers.products.length === 0) {
        bestSellers = await productService.getProducts({ limit: 8, sort: 'popular' });
      }
      if (!sale.products || sale.products.length === 0) {
        sale = await productService.getProducts({ limit: 8, sort: 'discount' });
      }

      return successResponse(res, 'Home products retrieved successfully', {
        featured: featured.products,
        trending: trending.products,
        newArrivals: newArrivals.products,
        bestSellers: bestSellers.products,
        sale: sale.products
      }, 200);
    } catch (error) {
      next(error);
    }
  }

  async getFeaturedProducts(req, res, next) {
    try {
      const { limit = 8 } = req.query;
      let data = await productService.getProducts({ featured: 'true', limit: parseInt(limit, 10) });
      if (!data.products || data.products.length === 0) {
        data = await productService.getProducts({ limit: parseInt(limit, 10), sort: 'newest' });
      }
      return successResponse(res, 'Featured products retrieved successfully', { products: data.products }, 200);
    } catch (error) {
      next(error);
    }
  }

  async getTrendingProducts(req, res, next) {
    try {
      const { limit = 8 } = req.query;
      let data = await productService.getProducts({ trending: 'true', limit: parseInt(limit, 10) });
      if (!data.products || data.products.length === 0) {
        data = await productService.getProducts({ limit: parseInt(limit, 10), sort: 'popular' });
      }
      return successResponse(res, 'Trending products retrieved successfully', { products: data.products }, 200);
    } catch (error) {
      next(error);
    }
  }

  async getNewProducts(req, res, next) {
    try {
      const { limit = 8 } = req.query;
      let data = await productService.getProducts({ newArrival: 'true', limit: parseInt(limit, 10) });
      if (!data.products || data.products.length === 0) {
        data = await productService.getProducts({ limit: parseInt(limit, 10), sort: 'newest' });
      }
      return successResponse(res, 'New products retrieved successfully', { products: data.products }, 200);
    } catch (error) {
      next(error);
    }
  }

  async getBestSellers(req, res, next) {
    try {
      const { limit = 8 } = req.query;
      let data = await productService.getProducts({ bestSeller: 'true', limit: parseInt(limit, 10) });
      if (!data.products || data.products.length === 0) {
        data = await productService.getProducts({ limit: parseInt(limit, 10), sort: 'popular' });
      }
      return successResponse(res, 'Best seller products retrieved successfully', { products: data.products }, 200);
    } catch (error) {
      next(error);
    }
  }

  async getRecommendedProductsEndpoint(req, res, next) {
    try {
      const { limit = 8 } = req.query;
      let data = await productService.getProducts({ recommended: 'true', limit: parseInt(limit, 10) });
      if (!data.products || data.products.length === 0) {
        data = await productService.getProducts({ limit: parseInt(limit, 10), sort: 'highest_rated' });
      }
      return successResponse(res, 'Recommended products retrieved successfully', { products: data.products }, 200);
    } catch (error) {
      next(error);
    }
  }

  async getRelatedProducts(req, res, next) {
    try {
      const { id } = req.params;
      const { limit } = req.query;
      const products = await productService.getRelatedProducts(id, limit);
      return successResponse(res, 'Related products retrieved successfully', { products }, 200);
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      return successResponse(res, 'Product retrieved successfully', { product }, 200);
    } catch (error) {
      if (error.message === 'Product not found') {
        return errorResponse(res, error.message, [], 404);
      }
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const product = await productService.createProduct(req.body);
      return successResponse(res, 'Product created successfully', { product }, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      return successResponse(res, 'Product updated successfully', { product }, 200);
    } catch (error) {
      if (error.message === 'Product not found') {
        return errorResponse(res, error.message, [], 404);
      }
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      await productService.deleteProduct(req.params.id);
      return successResponse(res, 'Product deleted successfully', {}, 200);
    } catch (error) {
      if (error.message === 'Product not found') {
        return errorResponse(res, error.message, [], 404);
      }
      next(error);
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = await productService.getCategories();
      return successResponse(res, 'Categories retrieved successfully', { categories }, 200);
    } catch (error) {
      next(error);
    }
  }

  async notifyStock(req, res, next) {
    try {
      const { id } = req.params;
      const { email, phone } = req.body;
      const userId = req.user?.id || null;

      if (!email) {
        return errorResponse(res, 'Email is required', [], 400);
      }

      // We need to import prisma at the top of the file or use a service.
      // Since it's a simple operation, we can do it via productService or directly here.
      // We'll use productService.
      await productService.createStockNotification(id, email, phone, userId);
      return successResponse(res, 'Notification request received successfully', {}, 200);
    } catch (error) {
      if (error.code === 'P2002') {
        // Unique constraint failed on the fields: (`productId`,`email`)
        return successResponse(res, 'You are already on the notification list for this product', {}, 200);
      }
      if (error.message === 'Product not found') {
        return errorResponse(res, error.message, [], 404);
      }
      next(error);
    }
  }
  async getNotifyStatus(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const email = req.user.email;
      
      const { default: prisma } = await import('../lib/prisma.js');
      const notification = await prisma.stockNotification.findFirst({
        where: { 
          productId: id,
          OR: [ { userId }, { email } ]
        }
      });
      
      return successResponse(res, 'Notification status retrieved', { isSubscribed: !!notification }, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();
