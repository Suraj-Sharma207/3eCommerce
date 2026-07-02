import prisma from '../lib/prisma.js';
import { mapProduct, mapProducts } from '../utils/productMapper.js';

/** Images include clause — re-used everywhere */
const IMAGE_INCLUDE = {
  images: {
    orderBy: { displayOrder: 'asc' },
  },
};

class ProductRepository {
  _buildWhereClause({ search, category, brand, minRating, minPrice, maxPrice, inStock, stockStatus, featured, trending, newArrival, bestSeller, recommended, sale, isAdmin }) {
    const andClauses = [];

    if (search) {
      andClauses.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ]
      });
    }

    if (category && category !== 'All') {
      const categoriesList = category.split(',').map(c => c.trim()).filter(Boolean);
      if (categoriesList.length > 0) {
        andClauses.push({
          category: { in: categoriesList }
        });
      }
    }

    if (brand && brand !== 'All') {
      const brandList = brand.split(',').map(b => b.trim()).filter(Boolean);
      if (brandList.length > 0) {
        andClauses.push({
          brand: { in: brandList }
        });
      }
    }

    if (minRating !== undefined && minRating !== '' && minRating !== null) {
      andClauses.push({
        rating: { gte: parseFloat(minRating) }
      });
    }

    if (minPrice !== undefined && minPrice !== '' && minPrice !== null || maxPrice !== undefined && maxPrice !== '' && maxPrice !== null) {
      const priceClause = {};
      if (minPrice !== undefined && minPrice !== '' && minPrice !== null) priceClause.gte = parseFloat(minPrice);
      if (maxPrice !== undefined && maxPrice !== '' && maxPrice !== null) priceClause.lte = parseFloat(maxPrice);
      andClauses.push({
        finalPrice: priceClause
      });
    }

    const availabilityConditions = [];
    // Legacy inStock boolean support
    if (inStock === 'true' || inStock === true) {
      availabilityConditions.push({ stock: { gt: 0 } });
    }
    
    // New stockStatus explicit handling
    if (stockStatus === 'active') {
      andClauses.push({ stock: { gt: 0 } });
    } else if (stockStatus === 'outOfStock') {
      andClauses.push({ stock: { equals: 0 } });
    }

    if (sale === 'true' || sale === true) {
      availabilityConditions.push({ discountPercentage: { gt: 0 } });
    }
    if (availabilityConditions.length > 0) {
      andClauses.push({
        OR: availabilityConditions
      });
    }

    if (featured === 'true' || featured === true) andClauses.push({ featured: true });
    if (trending === 'true' || trending === true) andClauses.push({ trending: true });
    if (newArrival === 'true' || newArrival === true) andClauses.push({ newArrival: true });
    if (bestSeller === 'true' || bestSeller === true) andClauses.push({ bestSeller: true });
    if (recommended === 'true' || recommended === true) andClauses.push({ recommended: true });

    if (!isAdmin) {
      andClauses.push({ active: true });
    }

    return { AND: andClauses };
  }

  async findAll({ skip, take, search, category, brand, minRating, minPrice, maxPrice, inStock, stockStatus, sort, featured, trending, newArrival, bestSeller, recommended, sale, isAdmin }) {
    const where = this._buildWhereClause({ search, category, brand, minRating, minPrice, maxPrice, inStock, stockStatus, featured, trending, newArrival, bestSeller, recommended, sale, isAdmin });

    let orderBy = { createdAt: 'desc' };
    if (sort === 'newest') orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (sort === 'price_asc') orderBy = { finalPrice: 'asc' };
    if (sort === 'price_desc') orderBy = { finalPrice: 'desc' };
    if (sort === 'name_asc') orderBy = { name: 'asc' };
    if (sort === 'name_desc') orderBy = { name: 'desc' };
    if (sort === 'stock_desc') orderBy = { stock: 'desc' };
    if (sort === 'stock_asc') orderBy = { stock: 'asc' };
    if (sort === 'popular') orderBy = { reviewCount: 'desc' };
    if (sort === 'highest_rated') orderBy = { rating: 'desc' };
    if (sort === 'discount') orderBy = { discountPercentage: 'desc' };

    const products = await prisma.product.findMany({
      where,
      skip,
      take,
      orderBy,
      include: IMAGE_INCLUDE,
    });

    return mapProducts(products);
  }

  async count(filters) {
    const where = this._buildWhereClause(filters);
    return await prisma.product.count({ where });
  }

  async countByStockStatus(filters) {
    // Generate base where clause excluding stockStatus itself
    const baseFilters = { ...filters };
    delete baseFilters.stockStatus;
    delete baseFilters.inStock;
    
    const baseWhere = this._buildWhereClause(baseFilters);

    // Run all counts in a single transaction
    const [all, active, outOfStock] = await prisma.$transaction([
      prisma.product.count({ where: baseWhere }),
      prisma.product.count({ where: { ...baseWhere, stock: { gt: 0 } } }),
      prisma.product.count({ where: { ...baseWhere, stock: { equals: 0 } } })
    ]);

    return { all, active, outOfStock };
  }

  async findById(identifier) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    let product;
    if (isUuid) {
      product = await prisma.product.findUnique({ where: { id: identifier }, include: IMAGE_INCLUDE });
    } else {
      product = await prisma.product.findUnique({ where: { slug: identifier }, include: IMAGE_INCLUDE });
    }
    return mapProduct(product);
  }

  async findRelated(id, limit = 4) {
    const product = await this.findById(id);
    if (!product) return [];

    const products = await prisma.product.findMany({
      where: {
        category: product.category,
        id: { not: id },
        active: true
      },
      take: parseInt(limit, 10),
      orderBy: { createdAt: 'desc' },
      include: IMAGE_INCLUDE,
    });

    return mapProducts(products);
  }

  async create(data) {
    return await prisma.product.create({ data, include: IMAGE_INCLUDE }).then(mapProduct);
  }

  async update(id, data) {
    return await prisma.product.update({
      where: { id },
      data,
      include: IMAGE_INCLUDE,
    }).then(mapProduct);
  }

  async delete(id) {
    return await prisma.product.delete({ where: { id } });
  }

  async getCategories() {
    const categories = await prisma.product.groupBy({
      by: ['category'],
      where: {
        active: true
      },
      _count: {
        category: true,
      },
      orderBy: {
        category: 'asc'
      }
    });

    const getCategoryIcon = (categoryName) => {
      const iconMap = {
        'Living Room': 'Sofa',
        'Bedroom': 'Bed',
        'Dining': 'Utensils',
        'Office': 'Monitor',
        'Lighting': 'Lightbulb',
        'Decor': 'Star',
        'Outdoor': 'Sun'
      };
      return iconMap[categoryName] || 'Package';
    };

    return categories.map(cat => ({
      id: cat.category.toLowerCase().replace(/\s+/g, '-'),
      name: cat.category,
      slug: cat.category.toLowerCase().replace(/\s+/g, '-'),
      icon: getCategoryIcon(cat.category),
      productCount: cat._count.category,
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

  async getStockNotificationStatus(productId, email) {
    return await prisma.stockNotification.findUnique({
      where: { productId_email: { productId, email } }
    });
  }

  // ── Image Management ─────────────────────────────────────────────────────

  async getImagesByProductId(productId) {
    return await prisma.productImage.findMany({
      where: { productId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async countImages(productId) {
    return await prisma.productImage.count({ where: { productId } });
  }

  async addImage(productId, imageData) {
    // Determine next displayOrder
    const maxOrderRow = await prisma.productImage.findFirst({
      where: { productId },
      orderBy: { displayOrder: 'desc' },
    });
    const nextOrder = maxOrderRow ? maxOrderRow.displayOrder + 1 : 0;

    return await prisma.productImage.create({
      data: {
        productId,
        displayOrder: nextOrder,
        ...imageData,
      },
    });
  }

  async getImageById(imageId) {
    return await prisma.productImage.findUnique({ where: { id: imageId } });
  }

  async deleteImage(imageId) {
    return await prisma.productImage.delete({ where: { id: imageId } });
  }

  /**
   * Set isPrimary=true on one image and isPrimary=false on all others
   * — runs in a single transaction.
   */
  async setPrimaryImage(productId, imageId) {
    return await prisma.$transaction([
      prisma.productImage.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false },
      }),
      prisma.productImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);
  }

  /**
   * Bulk-update displayOrder for an array of image IDs.
   * orderedIds = [id_for_order_0, id_for_order_1, ...]
   */
  async reorderImages(productId, orderedIds) {
    const updates = orderedIds.map((id, index) =>
      prisma.productImage.update({
        where: { id, productId },
        data: { displayOrder: index },
      })
    );
    return await prisma.$transaction(updates);
  }
}

export default new ProductRepository();
