import productRepository from '../repositories/productRepository.js';
import { validateProductInput } from '../utils/productValidation.js';
import prisma from '../lib/prisma.js';
import promotionService from './promotionService.js';

class ProductService {
  async getProducts({ page = 1, limit = 12, search = '', category, minPrice, maxPrice, inStock, sort, featured, trending, newArrival, bestSeller, sale }) {
    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    const filterArgs = { search, category, minPrice, maxPrice, inStock, sort, featured, trending, newArrival, bestSeller, sale };

    const [products, totalItems] = await Promise.all([
      productRepository.findAll({ skip, take, ...filterArgs }),
      productRepository.count(filterArgs),
    ]);

    const totalPages = Math.ceil(totalItems / take);

    // Fetch active promotions and calculate final prices dynamically
    const activePromotions = await promotionService.getActivePromotions();
    const dynamicProducts = await Promise.all(products.map(async (product) => {
      const { finalPrice, discountPercentage } = await promotionService.calculateProductPrice(product, activePromotions);
      return { ...product, finalPrice, discountPercentage };
    }));

    return {
      products: dynamicProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        itemsPerPage: take,
      },
    };
  }

  async getRelatedProducts(id, limit = 4) {
    return await productRepository.findRelated(id, limit);
  }

  async getProductById(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    const activePromotions = await promotionService.getActivePromotions();
    const { finalPrice, discountPercentage } = await promotionService.calculateProductPrice(product, activePromotions);

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
      description: data.description.trim(),
      sku: generatedSku,
      price: parseFloat(data.price),
      stock: parseInt(data.stock, 10),
      discountPercentage: 0,
      finalPrice: parseFloat(data.price),
    };

    return await productRepository.create(formattedData);
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

    const formattedData = {
      ...data,
      name: data.name.trim(),
      brand: data.brand.trim(),
      description: data.description.trim(),
      price: parseFloat(data.price),
      stock: parseInt(data.stock, 10),
      discountPercentage: 0,
      finalPrice: parseFloat(data.price),
    };

    return await productRepository.update(id, formattedData);
  }

  async deleteProduct(id) {
    await this.getProductById(id);
    return await productRepository.delete(id);
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
