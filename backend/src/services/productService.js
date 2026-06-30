import productRepository from '../repositories/productRepository.js';
import { validateProductInput } from '../utils/productValidation.js';
import prisma from '../lib/prisma.js';
import promotionService from './promotionService.js';
import { homeCache } from '../controllers/homeController.js';

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
  async getProducts({ page = 1, limit = 12, search = '', category, brand, minRating, minPrice, maxPrice, inStock, stockStatus, sort, featured, trending, newArrival, bestSeller, recommended, sale, includeInventoryCounts, isAdmin }) {
    const take = parseInt(limit);
    const filterArgs = { search, category, brand, minRating, minPrice, maxPrice, inStock, stockStatus, sort, featured, trending, newArrival, bestSeller, recommended, sale, includeInventoryCounts, isAdmin };

    // Fetch total items based on current stockStatus filter
    const totalItems = await productRepository.count(filterArgs);
    
    // Concurrently fetch counts for ALL stock statuses only if explicitly requested
    let inventoryCounts = null;
    if (filterArgs.includeInventoryCounts === 'true' || filterArgs.includeInventoryCounts === true) {
      inventoryCounts = await productRepository.countByStockStatus(filterArgs);
    }

    const totalPages = Math.max(1, Math.ceil(totalItems / take));

    let currentPage = parseInt(page);
    if (currentPage > totalPages) {
      currentPage = totalPages;
    }
    if (currentPage < 1) {
      currentPage = 1;
    }

    const skip = (currentPage - 1) * take;

    const products = await productRepository.findAll({ skip, take, ...filterArgs });

    // Fetch active promotions and calculate final prices dynamically
    const activePromotions = await promotionService.getActivePromotions();
    const dynamicProducts = await Promise.all(products.map(async (product) => {
      const { finalPrice, discountPercentage } = await promotionService.calculateProductPrice(product, activePromotions);
      return { ...product, finalPrice, discountPercentage };
    }));

    return {
      products: dynamicProducts,
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage: take,
        inventoryCounts,
      },
    };
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
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const randomStr = Math.floor(100000 + Math.random() * 900000);
    const generatedSku = `LUX-${dateStr}-${randomStr}`;

    const formattedData = {
      ...data,
      name: data.name.trim(),
      brand: data.brand.trim(),
      category: normalizeCategory(data.category),
      description: data.description.trim(),
      sku: generatedSku,
      price: parseFloat(data.price),
      stock: parseInt(data.stock, 10),
      discountPercentage: parseFloat(data.discountPercentage) || 0,
      finalPrice: parseFloat(data.price) - (parseFloat(data.price) * (parseFloat(data.discountPercentage) || 0) / 100),
    };

    // Remove legacy image fields — images are managed via ProductImage
    delete formattedData.thumbnail;
    delete formattedData.galleryImages;

    const created = await productRepository.create(formattedData);
    homeCache.clear();
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
    homeCache.clear();
    return updated;
  }

  async deleteProduct(id) {
    await this.getProductById(id);
    const deleted = await productRepository.delete(id);
    homeCache.clear();
    return deleted;
  }

  async getCategories() {
    return await productRepository.getCategories();
  }

  async createStockNotification(productId, email, phone, userId) {
    await this.getProductById(productId); // Ensure product exists
    return await productRepository.createStockNotification(productId, email, phone, userId);
  }
}

export default new ProductService();
