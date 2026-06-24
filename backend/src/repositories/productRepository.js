import prisma from '../lib/prisma.js';

class ProductRepository {
  async findAll({ skip, take, search, category, minPrice, maxPrice, inStock, sort }) {
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category && category !== 'All') {
      where.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = parseFloat(minPrice);
      if (maxPrice !== undefined) where.price.lte = parseFloat(maxPrice);
    }

    if (inStock === 'true') {
      where.stock = { gt: 0 };
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    // Popularity would need a view count or sales count, skipping or mocking for now

    return await prisma.product.findMany({
      where,
      skip,
      take,
      orderBy,
    });
  }

  async count({ search, category, minPrice, maxPrice, inStock }) {
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category && category !== 'All') {
      where.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = parseFloat(minPrice);
      if (maxPrice !== undefined) where.price.lte = parseFloat(maxPrice);
    }

    if (inStock === 'true') {
      where.stock = { gt: 0 };
    }

    return await prisma.product.count({ where });
  }

  async findById(id) {
    return await prisma.product.findUnique({ where: { id } });
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
}

export default new ProductRepository();
