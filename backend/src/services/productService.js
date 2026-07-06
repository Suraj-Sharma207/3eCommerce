import productRepository from '../repositories/productRepository.js';
import { validateProductInput } from '../utils/productValidation.js';
import prisma from '../lib/prisma.js';
import promotionService from './promotionService.js';
import { cacheGet, cacheSet, cacheInvalidateByPattern } from './cacheService.js';
import { env } from '../config/env.js';

const normalizeCategory = (category) => {
  if (!category) return 'Decor';
  return category
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

class ProductService {
  async getProducts({ page = 1, limit = 15, search = '', category, brand, minRating, minPrice, maxPrice, inStock, stockStatus, sort, featured, trending, newArrival, bestSeller, recommended, sale, includeInventoryCounts, isAdmin }) {
    // Generate deterministic cache key
    const filterArgs = { page, limit, search, category, brand, minRating, minPrice, maxPrice, inStock, stockStatus, sort, featured, trending, newArrival, bestSeller, recommended, sale, includeInventoryCounts, isAdmin };
    const sortedKeys = Object.keys(filterArgs).sort();
    const queryPart = sortedKeys.map(k => `${k}=${filterArgs[k] !== undefined && filterArgs[k] !== null ? filterArgs[k] : ''}`).join('&');
    const cacheKey = `products:list:${queryPart}`;

    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    // Safe integer clamping
    let take = parseInt(limit, 10);
    if (!Number.isFinite(take) || take < 1) take = 15;
    if (take > 50000) take = 50000;

    let currentPage = parseInt(page, 10);
    if (!Number.isFinite(currentPage) || currentPage < 1) currentPage = 1;
    const skip = (currentPage - 1) * take;

    // Concurrently fetch counts, products, and active promotions in parallel (1 RTT)
    const [filteredItems, totalItems, products, inventoryCounts, activePromotions] = await Promise.all([
      productRepository.count(filterArgs),
      productRepository.count({ isAdmin }),
      productRepository.findAll({ skip, take, ...filterArgs }),
      (filterArgs.includeInventoryCounts === 'true' || filterArgs.includeInventoryCounts === true)
        ? productRepository.countByStockStatus(filterArgs)
        : Promise.resolve(null),
      promotionService.getActivePromotions()
    ]);

    const totalPages = Math.max(1, Math.ceil(filteredItems / take));
    const finalCurrentPage = currentPage > totalPages ? totalPages : currentPage;

    const dynamicProducts = await Promise.all(products.map(async (product) => {
      const { finalPrice, discountPercentage } = await promotionService.calculateProductPrice(product, activePromotions);
      return { ...product, finalPrice, discountPercentage };
    }));

    const result = {
      products: dynamicProducts,
      pagination: {
        currentPage: finalCurrentPage,
        totalPages,
        totalItems,
        filteredItems,
        itemsPerPage: take,
        pageSize: take,
        inventoryCounts,
      },
    };

    await cacheSet(cacheKey, result, 300); // 5 mins TTL
    return result;
  }

  async getRelatedProducts(id, limit = 4) {
    const products = await productRepository.findRelated(id, limit);
    const activePromotions = await promotionService.getActivePromotions();
    const dynamicProducts = await Promise.all(products.map(async (product) => {
      const { finalPrice, discountPercentage } = await promotionService.calculateProductPrice(product, activePromotions);
      return { ...product, finalPrice, discountPercentage };
    }));
    return dynamicProducts;
  }

  async getProductById(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    const activePromotions = await promotionService.getActivePromotions();
    const { finalPrice, discountPercentage } = await promotionService.calculateProductPrice(product, activePromotions);

    // Increment totalViews asynchronously
    prisma.product.update({
      where: { id },
      data: { totalViews: { increment: 1 } }
    }).catch(err => console.error(`Failed to update totalViews for product ${id}:`, err));

    return { ...product, finalPrice, discountPercentage };
  }

  async createProduct(data) {
    const { isValid, errors } = validateProductInput(data);
    if (!isValid) {
      throw { statusCode: 400, message: Object.values(errors)[0] };
    }

    // Duplicate check
    const existingProduct = await prisma.product.findFirst({
      where: {
        name: { equals: data.name.trim(), mode: 'insensitive' },
        brand: { equals: data.brand.trim(), mode: 'insensitive' }
      }
    });

    if (existingProduct) {
      throw { statusCode: 400, message: 'A product with this name already exists.' };
    }

    // Generate SKU: LUX-YYYYMMDD-RANDOM(6 chars)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.floor(100000 + Math.random() * 900000);
    const generatedSku = `LUX-${dateStr}-${randomStr}`;

    const formattedData = {
      ...data,
      name: data.name.trim(),
      brand: data.brand.trim(),
      category: normalizeCategory(data.category),
      description: data.description.trim(),
      sku: data.sku || generatedSku,
      price: parseFloat(data.price),
      stock: parseInt(data.stock, 10),
      discountPercentage: parseFloat(data.discountPercentage) || 0,
      finalPrice: parseFloat(data.price) - (parseFloat(data.price) * (parseFloat(data.discountPercentage) || 0) / 100),
    };

    // Remove legacy image fields — images are managed via ProductImage
    delete formattedData.thumbnail;
    delete formattedData.galleryImages;

    const created = await productRepository.create(formattedData);
    await cacheInvalidateByPattern('products:*');
    await cacheInvalidateByPattern('home:*');
    await cacheInvalidateByPattern('admin:dashboard:*');
    this._syncProductToAI('create', created);
    return created;
  }

  async updateProduct(id, data) {
    await this.getProductById(id); // Ensure exists

    const { isValid, errors } = validateProductInput(data);
    if (!isValid) {
      throw { statusCode: 400, message: Object.values(errors)[0] };
    }

    // Duplicate check
    const existingProduct = await prisma.product.findFirst({
      where: {
        name: { equals: data.name.trim(), mode: 'insensitive' },
        brand: { equals: data.brand.trim(), mode: 'insensitive' },
        id: { not: id }
      }
    });

    if (existingProduct) {
      throw { statusCode: 400, message: 'A product with this name already exists.' };
    }

    // Strip immutable fields
    delete data.sku;
    delete data.id;
    delete data.createdAt;
    delete data.createdBy; // Just in case

    // Only pick fields that exist in the Prisma Product schema — prevents unknown-field crashes
    const formattedData = {
      name: data.name.trim(),
      brand: data.brand.trim(),
      description: data.description.trim(),
      category: normalizeCategory(data.category),
      price: parseFloat(data.price),
      stock: parseInt(data.stock, 10),
      discountPercentage: parseFloat(data.discountPercentage) || 0,
      finalPrice: parseFloat(data.price) - (parseFloat(data.price) * (parseFloat(data.discountPercentage) || 0) / 100),
      featured: Boolean(data.featured),
      active: Boolean(data.active),
      trending: Boolean(data.trending),
      bestSeller: Boolean(data.bestSeller),
      newArrival: Boolean(data.newArrival),
      recommended: Boolean(data.recommended),
      // Images are managed separately via ProductImage — not written here
    };

    const updated = await productRepository.update(id, formattedData);
    await cacheInvalidateByPattern('products:*');
    await cacheInvalidateByPattern('home:*');
    await cacheInvalidateByPattern('admin:dashboard:*');
    this._syncProductToAI('update', updated);
    return updated;
  }

  async deleteProduct(id) {
    await this.getProductById(id);
    const deleted = await productRepository.delete(id);
    await cacheInvalidateByPattern('products:*');
    await cacheInvalidateByPattern('home:*');
    await cacheInvalidateByPattern('admin:dashboard:*');
    this._syncProductToAI('delete', { id });
    return deleted;
  }

  async bulkDeleteProducts(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw { statusCode: 400, message: 'No product IDs provided' };
    }
    const { count } = await prisma.$transaction(async (tx) => {
      return tx.product.deleteMany({
        where: { id: { in: ids } }
      });
    });
    await cacheInvalidateByPattern('products:*');
    await cacheInvalidateByPattern('home:*');
    await cacheInvalidateByPattern('admin:dashboard:*');
    
    // Sync to AI in background
    ids.forEach(id => this._syncProductToAI('delete', { id }));
    
    return { deleted: count };
  }

  async getFilteredProductIds({ search, category, brand, minRating, minPrice, maxPrice, inStock, stockStatus, sort, featured, trending, newArrival, bestSeller, recommended, sale, isAdmin }) {
    const ids = await productRepository.findAllIds({ search, category, brand, minRating, minPrice, maxPrice, inStock, stockStatus, featured, trending, newArrival, bestSeller, recommended, sale, isAdmin });
    return ids;
  }

  async getCategories() {
    const cacheKey = 'products:categories';
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const categories = await productRepository.getCategories();
    await cacheSet(cacheKey, categories, 3600); // 1 hour TTL
    return categories;
  }

  async createStockNotification(productId, email, phone, userId) {
    await this.getProductById(productId); // Ensure product exists
    return await productRepository.createStockNotification(productId, email, phone, userId);
  }

  /**
   * Sync product data to AI vector store asynchronously
   * Does not block the main execution thread
   */
  _syncProductToAI(action, product) {
    const chatbotUrl = env.chatbotServiceUrl || 'http://localhost:8000';
    const apiKey = env.chatbotApiKey || '';

    // Fire and forget
    fetch(`${chatbotUrl}/sync/product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Chatbot-API-Key': apiKey,
      },
      body: JSON.stringify({ action, product }),
    }).catch(err => console.error(`[AI Sync] Failed to sync product ${product.id} (${action}):`, err.message));
  }
}

export default new ProductService();
