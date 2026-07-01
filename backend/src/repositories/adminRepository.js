import prisma from '../lib/prisma.js';

class AdminRepository {
  async getDashboardMetrics() {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) console.time('Total Revenue Query');
    const totalRevenuePromise = prisma.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { totalAmount: true }
    }).finally(() => { if (isDev) console.timeEnd('Total Revenue Query'); });

    if (isDev) console.time('Total Orders Query');
    const totalOrdersPromise = prisma.order.count()
      .finally(() => { if (isDev) console.timeEnd('Total Orders Query'); });

    if (isDev) console.time('Total Customers Query');
    const totalCustomersPromise = prisma.user.count({ where: { role: 'CUSTOMER' } })
      .finally(() => { if (isDev) console.timeEnd('Total Customers Query'); });

    if (isDev) console.time('Total Products Query');
    const totalProductsPromise = prisma.product.count()
      .finally(() => { if (isDev) console.timeEnd('Total Products Query'); });

    if (isDev) console.time('Recent Orders Query');
    const recentOrdersPromise = prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } }
      }
    }).finally(() => { if (isDev) console.timeEnd('Recent Orders Query'); });

    if (isDev) console.time('Top Products Grouping');
    const topProductsPromise = prisma.product.findMany({
      orderBy: { totalSold: 'desc' },
      take: 5,
      include: { images: { orderBy: { displayOrder: 'asc' } } }
    }).finally(() => { if (isDev) console.timeEnd('Top Products Grouping'); });

    if (isDev) console.time('Revenue Trend Query');
    const recentPaidOrdersPromise = prisma.order.findMany({
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) }
      },
      select: { totalAmount: true, createdAt: true }
    }).finally(() => { if (isDev) console.timeEnd('Revenue Trend Query'); });

    if (isDev) console.time('Order Status Query');
    const orderStatusesPromise = prisma.order.groupBy({
      by: ['orderStatus'],
      _count: { orderStatus: true }
    }).finally(() => { if (isDev) console.timeEnd('Order Status Query'); });

    const [
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      recentOrders,
      topProducts,
      recentPaidOrders,
      orderStatuses
    ] = await Promise.all([
      totalRevenuePromise,
      totalOrdersPromise,
      totalCustomersPromise,
      totalProductsPromise,
      recentOrdersPromise,
      topProductsPromise,
      recentPaidOrdersPromise,
      orderStatusesPromise
    ]);

    // Populate top products with a bulk query
    if (isDev) console.time('Top Products Details Fetch');
    let populatedTopProducts = [];
    if (topProducts.length > 0) {
      // Note: we can use the productMapper to properly map the thumbnail
      const { mapProduct } = await import('../utils/productMapper.js');
      populatedTopProducts = topProducts.map(p => ({
        product: mapProduct(p),
        totalSold: p.totalSold,
        revenue: p.totalRevenue
      }));
    }
    if (isDev) console.timeEnd('Top Products Details Fetch');

    // Extended Analytics Stats
    const [
      mostViewed,
      highestRevenue,
      highestSelling,
      mostWishlisted,
      mostAddedToCart,
      lowestStock,
      neverSold
    ] = await Promise.all([
      prisma.product.findFirst({ orderBy: { totalViews: 'desc' }, select: { name: true, totalViews: true } }),
      prisma.product.findFirst({ orderBy: { totalRevenue: 'desc' }, select: { name: true, totalRevenue: true } }),
      prisma.product.findFirst({ orderBy: { totalSold: 'desc' }, select: { name: true, totalSold: true } }),
      prisma.product.findFirst({ orderBy: { wishlistCount: 'desc' }, select: { name: true, wishlistCount: true } }),
      prisma.product.findFirst({ orderBy: { cartCount: 'desc' }, select: { name: true, cartCount: true } }),
      prisma.product.findFirst({ where: { stock: { gt: 0 } }, orderBy: { stock: 'asc' }, select: { name: true, stock: true } }),
      prisma.product.findMany({ where: { totalSold: 0 }, take: 5, select: { name: true } })
    ]);

    return {
      revenue: totalRevenue._sum.totalAmount || 0,
      orders: totalOrders,
      customers: totalCustomers,
      products: totalProducts,
      recentOrders,
      topProducts: populatedTopProducts,
      recentPaidOrders,
      orderStatuses,
      mostViewed,
      highestRevenue,
      highestSelling,
      mostWishlisted,
      mostAddedToCart,
      lowestStock,
      neverSold
    };
  }

  async getInventoryAlerts() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [outOfStock, lowStock, recentlyRestocked, recentlyAdded] = await Promise.all([
      prisma.product.findMany({
        where: { stock: 0 },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: { id: true, name: true, sku: true, stock: true, updatedAt: true, createdAt: true }
      }),
      prisma.product.findMany({
        where: { stock: { gt: 0, lte: 5 } },
        orderBy: { stock: 'asc' },
        take: 10,
        select: { id: true, name: true, sku: true, stock: true, updatedAt: true, createdAt: true }
      }),
      prisma.product.findMany({
        where: { stock: { gt: 0 }, updatedAt: { gte: today } },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: { id: true, name: true, sku: true, stock: true, updatedAt: true, createdAt: true }
      }),
      prisma.product.findMany({
        where: { createdAt: { gte: today } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, name: true, sku: true, stock: true, updatedAt: true, createdAt: true }
      })
    ]);

    return { outOfStock, lowStock, recentlyRestocked, recentlyAdded };
  }

  async getRevenueAnalytics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - today.getDay());
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisYear = new Date(today.getFullYear(), 0, 1);

    const [allPaid, deliveredItemsRaw] = await Promise.all([
      prisma.order.findMany({
        where: { paymentStatus: 'PAID' },
        select: { totalAmount: true, createdAt: true }
      }),
      prisma.orderItem.findMany({
        where: {
          order: { orderStatus: 'DELIVERED' }
        },
        include: {
          product: { select: { id: true, name: true, category: true, images: { orderBy: { displayOrder: 'asc' }, take: 1 } } }
        }
      })
    ]);

    let todayRev = 0, yesterdayRev = 0, thisWeekRev = 0, thisMonthRev = 0, thisYearRev = 0, highest = 0, total = 0;
    allPaid.forEach(o => {
      total += o.totalAmount;
      if (o.totalAmount > highest) highest = o.totalAmount;
      if (o.createdAt >= today) todayRev += o.totalAmount;
      else if (o.createdAt >= yesterday && o.createdAt < today) yesterdayRev += o.totalAmount;
      if (o.createdAt >= thisWeek) thisWeekRev += o.totalAmount;
      if (o.createdAt >= thisMonth) thisMonthRev += o.totalAmount;
      if (o.createdAt >= thisYear) thisYearRev += o.totalAmount;
    });

    const aov = allPaid.length > 0 ? total / allPaid.length : 0;

    // Aggregate category and product revenue from delivered items
    const categoryMap = {};
    const productMap = {};

    deliveredItemsRaw.forEach(item => {
      const itemRev = item.quantity * item.price;
      const cat = item.product?.category || 'Unknown';
      const prodId = item.product?.id || 'UnknownId';
      const prodName = item.product?.name || 'Unknown Product';
      const thumbnail = item.product?.images?.[0]?.url || '';

      if (!categoryMap[cat]) categoryMap[cat] = 0;
      categoryMap[cat] += itemRev;

      if (!productMap[prodId]) productMap[prodId] = { id: prodId, name: prodName, thumbnail, qtySold: 0, revenue: 0 };
      productMap[prodId].qtySold += item.quantity;
      productMap[prodId].revenue += itemRev;
    });

    const byCategory = Object.keys(categoryMap)
      .map(cat => ({ category: cat, revenue: categoryMap[cat] }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const byProduct = Object.values(productMap)
      .map(p => ({ id: p.id, name: p.name, thumbnail: p.thumbnail, sold: p.qtySold, revenue: p.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      summary: { total, today: todayRev, yesterday: yesterdayRev, thisWeek: thisWeekRev, thisMonth: thisMonthRev, thisYear: thisYearRev, aov, highest },
      byCategory,
      byProduct
    };
  }

  async getOrdersAnalytics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [allOrders, topCustomersRaw] = await Promise.all([
      prisma.order.findMany({ select: { orderStatus: true, createdAt: true } }),
      prisma.order.groupBy({
        by: ['userId'],
        _sum: { totalAmount: true },
        _count: { id: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 10
      })
    ]);

    const summary = { total: allOrders.length, today: 0, pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
    allOrders.forEach(o => {
      if (o.createdAt >= today) summary.today++;
      if (o.orderStatus === 'PENDING') summary.pending++;
      if (o.orderStatus === 'CONFIRMED') summary.confirmed++;
      if (o.orderStatus === 'SHIPPED') summary.shipped++;
      if (o.orderStatus === 'DELIVERED') summary.delivered++;
      if (o.orderStatus === 'CANCELLED') summary.cancelled++;
    });

    // Fetch user names for top customers
    const userIds = topCustomersRaw.map(c => c.userId).filter(id => id);
    let users = [];
    if (userIds.length > 0) {
      users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } });
    }
    const userMap = users.reduce((acc, u) => { acc[u.id] = u; return acc; }, {});

    const topCustomers = topCustomersRaw.map(c => ({
      customer: userMap[c.userId] || { name: 'Unknown User' },
      orders: c._count.id || 0,
      revenue: c._sum.totalAmount || 0
    }));

    return { summary, topCustomers };
  }

  async getCustomersAnalytics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - today.getDay());
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [allCustomers, deliveredOrders] = await Promise.all([
      prisma.user.findMany({ where: { role: 'CUSTOMER' }, select: { createdAt: true } }),
      prisma.order.findMany({ where: { orderStatus: 'DELIVERED' }, select: { totalAmount: true, userId: true } })
    ]);

    const summary = { total: allCustomers.length, today: 0, thisWeek: 0, thisMonth: 0 };
    allCustomers.forEach(c => {
      if (c.createdAt >= today) summary.today++;
      if (c.createdAt >= thisWeek) summary.thisWeek++;
      if (c.createdAt >= thisMonth) summary.thisMonth++;
    });

    // LTV Calculation
    const totalDeliveredRevenue = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const averageLifetimeValue = allCustomers.length > 0 ? totalDeliveredRevenue / allCustomers.length : 0;
    const averageOrdersPerCustomer = allCustomers.length > 0 ? deliveredOrders.length / allCustomers.length : 0;

    return {
      summary,
      ltv: { averageLifetimeValue, averageOrdersPerCustomer }
    };
  }

  async getProductsAnalytics() {
    const [allProducts, bestSelling, lowestSelling] = await Promise.all([
      prisma.product.findMany({ select: { active: true, stock: true } }),
      prisma.product.findMany({ orderBy: { totalSold: 'desc' }, take: 10, select: { id: true, name: true, stock: true, totalSold: true } }),
      prisma.product.findMany({ orderBy: { totalSold: 'asc' }, take: 10, select: { id: true, name: true, stock: true, totalSold: true } })
    ]);

    const summary = { total: allProducts.length, active: 0, draft: 0, outOfStock: 0, lowStock: 0 };
    allProducts.forEach(p => {
      if (p.active) summary.active++; else summary.draft++;
      if (p.stock === 0) summary.outOfStock++;
      else if (p.stock <= 5) summary.lowStock++;
    });

    return {
      summary,
      performance: { bestSelling, lowestSelling }
    };
  }

  async getDeliveriesAnalytics() {
    const [allOrders, recent] = await Promise.all([
      prisma.order.findMany({ select: { orderStatus: true } }),
      prisma.order.findMany({
        where: { orderStatus: { in: ['SHIPPED', 'DELIVERED'] } },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: { id: true, orderNumber: true, orderStatus: true, totalAmount: true, updatedAt: true, user: { select: { name: true } } }
      })
    ]);

    const summary = { total: allOrders.length, processing: 0, inTransit: 0, delivered: 0, delayed: 0 };
    allOrders.forEach(o => {
      if (o.orderStatus === 'CONFIRMED' || o.orderStatus === 'PENDING') summary.processing++;
      if (o.orderStatus === 'SHIPPED') summary.inTransit++;
      if (o.orderStatus === 'DELIVERED') summary.delivered++;
    });

    return { ...summary, recent: recent.map(r => ({ ...r, status: r.orderStatus })) };
  }

  async getCancellationsAnalytics() {
    const [allOrders, recent] = await Promise.all([
      prisma.order.findMany({ select: { orderStatus: true } }),
      prisma.order.findMany({
        where: { orderStatus: 'CANCELLED' },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: { id: true, orderNumber: true, orderStatus: true, totalAmount: true, updatedAt: true, user: { select: { name: true } } }
      })
    ]);

    const summary = { total: allOrders.length, cancelled: 0, refunded: 0, rejected: 0 };
    allOrders.forEach(o => {
      if (o.orderStatus === 'CANCELLED') summary.cancelled++;
    });

    return { ...summary, recent: recent.map(r => ({ ...r, status: r.orderStatus })) };
  }

  async getAllCustomers({ page = 1, limit = 10, search = '' }) {
    const skip = (page - 1) * limit;

    let whereClause = { role: 'CUSTOMER' };

    if (search) {
      whereClause = {
        ...whereClause,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const customers = await prisma.user.findMany({
      where: whereClause,
      skip,
      take: parseInt(limit, 10),
      orderBy: { createdAt: 'desc' },
      include: {
        orders: {
          select: { id: true, totalAmount: true }
        },
        wishlist: {
          select: { id: true } // just need to check existence or count items if we include items
        }
      }
    });

    const total = await prisma.user.count({ where: whereClause });

    // Populate full wishlist item counts
    const populatedCustomers = await Promise.all(customers.map(async (c) => {
      let wishlistCount = 0;
      if (c.wishlist) {
        wishlistCount = await prisma.wishlistItem.count({ where: { wishlistId: c.wishlist.id } });
      }

      const totalSpend = c.orders.reduce((sum, order) => sum + order.totalAmount, 0);

      return {
        ...c,
        totalSpend,
        orderCount: c.orders.length,
        wishlistCount,
        password: undefined // Never send password
      };
    }));

    return {
      customers: populatedCustomers,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit, 10)
      }
    };
  }

  async getCustomerById(id) {
    const customer = await prisma.user.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          include: { items: { include: { product: true } } }
        },
        wishlist: {
          include: { items: { include: { product: true } } }
        }
      }
    });

    if (!customer) return null;
    customer.password = undefined;

    const totalSpend = customer.orders.reduce((sum, order) => sum + order.totalAmount, 0);

    return {
      ...customer,
      totalSpend,
      orderCount: customer.orders.length,
      wishlistCount: customer.wishlist?.items?.length || 0
    };
  }

  async updateCustomerStatus(customerId, active) {
    return prisma.user.update({
      where: { id: customerId },
      data: { active },
      select: { id: true, name: true, email: true, active: true }
    });
  }

  async getOrderById(orderId) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { displayOrder: 'asc' } }
              }
            }
          }
        }
      }
    });
  }
}

export default new AdminRepository();
