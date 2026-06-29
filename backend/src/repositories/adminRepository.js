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
    const topProductsPromise = prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, price: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
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
      const productIds = topProducts.map(tp => tp.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { images: { orderBy: { displayOrder: 'asc' } } }
      });

      const productMap = products.reduce((acc, p) => {
        acc[p.id] = {
          ...p,
          thumbnail: p.images?.[0]?.url || null
        };
        delete acc[p.id].images;
        return acc;
      }, {});

      populatedTopProducts = topProducts.map(tp => ({
        product: productMap[tp.productId],
        totalSold: tp._sum.quantity,
        revenue: tp._sum.price
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

    const [allPaid, byCategoryRaw, byBrandRaw] = await Promise.all([
      prisma.order.findMany({
        where: { paymentStatus: 'PAID' },
        select: { totalAmount: true, createdAt: true }
      }),
      prisma.product.groupBy({
        by: ['category'],
        _sum: { totalRevenue: true },
        orderBy: { _sum: { totalRevenue: 'desc' } }
      }),
      prisma.product.groupBy({
        by: ['brand'],
        _sum: { totalRevenue: true },
        orderBy: { _sum: { totalRevenue: 'desc' } }
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

    return {
      summary: { total, today: todayRev, yesterday: yesterdayRev, thisWeek: thisWeekRev, thisMonth: thisMonthRev, thisYear: thisYearRev, aov, highest },
      byCategory: byCategoryRaw.map(c => ({ category: c.category || 'Unknown', revenue: c._sum.totalRevenue || 0 })),
      byBrand: byBrandRaw.map(b => ({ brand: b.brand || 'Unknown', revenue: b._sum.totalRevenue || 0 }))
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
      take: parseInt(limit),
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
        itemsPerPage: parseInt(limit)
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

  async updateCustomerStatus(id, active) {
    const customer = await prisma.user.update({
      where: { id },
      data: { active }
    });
    customer.password = undefined;
    return customer;
  }
}

export default new AdminRepository();
