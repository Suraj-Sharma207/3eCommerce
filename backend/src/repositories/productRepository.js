import prisma from '../lib/prisma.js';

class ProductRepository {
  async findAll({ skip, take, search, category, brand, minRating, minPrice, maxPrice, inStock, sort, featured, trending, newArrival, bestSeller, sale }) {
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category && category !== 'All') {
      where.category = category;
    }

    if (brand && brand !== 'All') {
      where.brand = brand;
    }

    if (minRating !== undefined) {
      where.rating = { gte: parseFloat(minRating) };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.finalPrice = {};
      if (minPrice !== undefined) where.finalPrice.gte = parseFloat(minPrice);
      if (maxPrice !== undefined) where.finalPrice.lte = parseFloat(maxPrice);
    }

    if (inStock === 'true' || inStock === true) {
      where.stock = { gt: 0 };
    }

    if (featured === 'true' || featured === true) where.featured = true;
    if (trending === 'true' || trending === true) where.trending = true;
    if (newArrival === 'true' || newArrival === true) where.newArrival = true;
    if (bestSeller === 'true' || bestSeller === true) where.bestSeller = true;
    if (sale === 'true' || sale === true) where.discountPercentage = { gt: 0 };

    where.active = true;

    let orderBy = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { finalPrice: 'asc' };
    if (sort === 'price_desc') orderBy = { finalPrice: 'desc' };
    if (sort === 'popular') orderBy = { reviewCount: 'desc' };
    if (sort === 'highest_rated') orderBy = { rating: 'desc' };
    if (sort === 'discount') orderBy = { discountPercentage: 'desc' };
    if (sort === 'newest') orderBy = { createdAt: 'desc' };

    return await prisma.product.findMany({
      where,
      skip,
      take,
      orderBy,
    });
  }

  async count({ search, category, brand, minRating, minPrice, maxPrice, inStock, featured, trending, newArrival, bestSeller, sale }) {
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category && category !== 'All') {
      where.category = category;
    }

    if (brand && brand !== 'All') {
      where.brand = brand;
    }

    if (minRating !== undefined) {
      where.rating = { gte: parseFloat(minRating) };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.finalPrice = {};
      if (minPrice !== undefined) where.finalPrice.gte = parseFloat(minPrice);
      if (maxPrice !== undefined) where.finalPrice.lte = parseFloat(maxPrice);
    }

    if (inStock === 'true' || inStock === true) {
      where.stock = { gt: 0 };
    }

    if (featured === 'true' || featured === true) where.featured = true;
    if (trending === 'true' || trending === true) where.trending = true;
    if (newArrival === 'true' || newArrival === true) where.newArrival = true;
    if (bestSeller === 'true' || bestSeller === true) where.bestSeller = true;
    if (sale === 'true' || sale === true) where.discountPercentage = { gt: 0 };

    where.active = true;

    return await prisma.product.count({ where });
  }

  async findById(identifier) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    if (isUuid) {
      return await prisma.product.findUnique({ where: { id: identifier } });
    } else {
      return await prisma.product.findUnique({ where: { slug: identifier } });
    }
  }

  async findRelated(id, limit = 4) {
    const product = await this.findById(id);
    if (!product) return [];

    return await prisma.product.findMany({
      where: {
        category: product.category,
        id: { not: id },
        active: true
      },
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(data) {
    return await prisma.product.create({ data });
  }

  async update(id, data) {
    return await prisma.product.update({
      where: { id },
      data,
    });
  }

  async delete(id) {
    return await prisma.product.delete({ where: { id } });
  }

  async getCategories() {
    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
      orderBy: {
        category: 'asc'
      }
    });

    return categories.map(cat => ({
      name: cat.category,
      slug: cat.category.toLowerCase().replace(/\s+/g, '-'),
      count: cat._count.category,
    }));
  }

  async createStockNotification(productId, email, phone, userId) {
    return await prisma.stockNotification.create({
      data: {
        productId,
        email,
        phone,
        userId
      }
    });
  }
}

export default new ProductRepository();
