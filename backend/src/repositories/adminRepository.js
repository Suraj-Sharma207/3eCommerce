import prisma from '../lib/prisma.js';

class AdminRepository {
  async getKpis() {
    const [totalRevenue, totalOrders, totalCustomers, totalProducts, orderStatuses] = await Promise.all([
      prisma.order.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { totalAmount: true } }),
      prisma.order.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count(),
      prisma.order.groupBy({ by: ['orderStatus'], _count: { orderStatus: true } })
    ]);

    const deliveredOrders = orderStatuses.find(s => s.orderStatus === 'DELIVERED')?._count?.orderStatus || 0;
    const cancelledOrders = orderStatuses.find(s => s.orderStatus === 'CANCELLED')?._count?.orderStatus || 0;

    return {
      revenue: totalRevenue._sum.totalAmount || 0,
      orders: totalOrders,
      customers: totalCustomers,
      products: totalProducts,
      deliveredOrders,
      cancelledOrders
    };
  }

  async getRecentOrders() {
    return prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    });
  }

  async getTopProducts() {
    const topProducts = await prisma.product.findMany({
      orderBy: { totalSold: 'desc' },
      take: 5,
      include: { images: { orderBy: { displayOrder: 'asc' } } }
    });
    let populatedTopProducts = [];
    if (topProducts.length > 0) {
      const { mapProduct } = await import('../utils/productMapper.js');
      populatedTopProducts = topProducts.map(p => ({
        product: mapProduct(p),
        totalSold: p.totalSold,
        revenue: p.totalRevenue
      }));
    }
    return populatedTopProducts;
  }

  async getOrderStatuses() {
    const orderStatuses = await prisma.order.groupBy({
      by: ['orderStatus'],
      _count: { orderStatus: true }
    });
    return orderStatuses.map(status => ({
      name: status.orderStatus,
      value: status._count.orderStatus
    }));
  }

  async getExtendedStats() {
    const [mostViewed, highestRevenue, highestSelling, mostWishlisted, mostAddedToCart, lowestStock, neverSold] = await Promise.all([
      prisma.product.findFirst({ orderBy: { totalViews: 'desc' }, select: { name: true, totalViews: true } }),
      prisma.product.findFirst({ orderBy: { totalRevenue: 'desc' }, select: { name: true, totalRevenue: true } }),
      prisma.product.findFirst({ orderBy: { totalSold: 'desc' }, select: { name: true, totalSold: true } }),
      prisma.product.findFirst({ orderBy: { wishlistCount: 'desc' }, select: { name: true, wishlistCount: true } }),
      prisma.product.findFirst({ orderBy: { cartCount: 'desc' }, select: { name: true, cartCount: true } }),
      prisma.product.findFirst({ where: { stock: { gt: 0 } }, orderBy: { stock: 'asc' }, select: { name: true, stock: true } }),
      prisma.product.findMany({ where: { totalSold: 0 }, take: 5, select: { name: true } })
    ]);
    return { mostViewed, highestRevenue, highestSelling, mostWishlisted, mostAddedToCart, lowestStock, neverSold };
  }

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
      const itemRev = Number(item.quantity) * Number(item.price);
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
    const allOrders = await prisma.order.findMany({
      select: { orderStatus: true, updatedAt: true, totalAmount: true }
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalDelivered = 0;
    let todayDelivered = 0;
    let thisWeekDelivered = 0;
    let thisMonthDelivered = 0;

    let totalForRate = 0;
    let deliveredForRate = 0;

    allOrders.forEach(o => {
      if (o.orderStatus !== 'PENDING') {
        totalForRate++;
        if (o.orderStatus === 'DELIVERED') {
          deliveredForRate++;
        }
      }

      if (o.orderStatus === 'DELIVERED') {
        totalDelivered++;
        const updateDate = new Date(o.updatedAt);
        if (updateDate >= startOfToday) todayDelivered++;
        if (updateDate >= startOfWeek) thisWeekDelivered++;
        if (updateDate >= startOfMonth) thisMonthDelivered++;
      }
    });

    const successRate = totalForRate > 0 ? (deliveredForRate / totalForRate) * 100 : 100;

    const recent = await prisma.order.findMany({
      where: { orderStatus: { in: ['SHIPPED', 'DELIVERED'] } },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: { id: true, orderNumber: true, orderStatus: true, totalAmount: true, updatedAt: true, user: { select: { name: true } } }
    });

    return {
      summary: {
        total: totalDelivered,
        today: todayDelivered,
        thisWeek: thisWeekDelivered,
        thisMonth: thisMonthDelivered
      },
      successRate,
      recent: recent.map(r => ({ ...r, status: r.orderStatus }))
    };
  }

  async getCancellationsAnalytics() {
    const allOrders = await prisma.order.findMany({
      select: { orderStatus: true, updatedAt: true, totalAmount: true }
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalCancelled = 0;
    let todayCancelled = 0;
    let thisWeekCancelled = 0;
    let thisMonthCancelled = 0;
    let refundAmount = 0;

    allOrders.forEach(o => {
      if (o.orderStatus === 'CANCELLED') {
        totalCancelled++;
        refundAmount += Number(o.totalAmount || 0);
        const updateDate = new Date(o.updatedAt);
        if (updateDate >= startOfToday) todayCancelled++;
        if (updateDate >= startOfWeek) thisWeekCancelled++;
        if (updateDate >= startOfMonth) thisMonthCancelled++;
      }
    });

    const cancelRate = allOrders.length > 0 ? (totalCancelled / allOrders.length) * 100 : 0;

    const recent = await prisma.order.findMany({
      where: { orderStatus: 'CANCELLED' },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: { id: true, orderNumber: true, orderStatus: true, totalAmount: true, updatedAt: true, user: { select: { name: true } } }
    });

    return {
      summary: {
        total: totalCancelled,
        today: todayCancelled,
        thisWeek: thisWeekCancelled,
        thisMonth: thisMonthCancelled
      },
      cancelRate,
      refundAmount,
      recent: recent.map(r => ({ ...r, status: r.orderStatus }))
    };
  }

  async getAllCustomers({ page = 1, limit = 10, search = '', status, minDate, maxDate, sort }) {
    // Safe integer clamping
    let take = parseInt(limit, 10);
    if (!Number.isFinite(take) || take < 1) take = 10;
    if (take > 50000) take = 50000;

    let currentPage = parseInt(page, 10);
    if (!Number.isFinite(currentPage) || currentPage < 1) currentPage = 1;

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
    
    if (status === 'active') whereClause.active = true;
    if (status === 'inactive') whereClause.active = false;

    const isValidDate = (d) => d && !isNaN(Date.parse(d));
    if ((minDate && isValidDate(minDate)) || (maxDate && isValidDate(maxDate))) {
      whereClause.createdAt = {};
      if (minDate && isValidDate(minDate)) whereClause.createdAt.gte = new Date(minDate);
      if (maxDate && isValidDate(maxDate)) {
        const endDate = new Date(maxDate);
        endDate.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = endDate;
      }
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (sort === 'name_asc') orderBy = { name: 'asc' };
    if (sort === 'name_desc') orderBy = { name: 'desc' };

    // filteredItems = matching current filters
    const filteredItems = await prisma.user.count({ where: whereClause });

    // totalItems = all customers (role = CUSTOMER, no other filters)
    // Avoid running a second count query if no filters were applied
    const hasAdditionalFilters = Object.keys(whereClause).length > 1;
    const totalItems = hasAdditionalFilters 
      ? await prisma.user.count({ where: { role: 'CUSTOMER' } })
      : filteredItems;

    const totalPages = Math.max(1, Math.ceil(filteredItems / take));
    if (currentPage > totalPages) currentPage = totalPages;

    const skip = (currentPage - 1) * take;
    const customers = await prisma.user.findMany({
      where: whereClause,
      skip,
      take,
      orderBy,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        gender: true,
        birthday: true,
        avatarUrl: true,
        avatarPublicId: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        failedLoginAttempts: true,
        lockoutUntil: true,
        tokenVersion: true,
        passwordUpdatedAt: true,
        isEmailVerified: true
      }
    });

    const customerIds = customers.map(c => c.id);

    // Fetch order aggregates (total spend and order count) efficiently via DB engine
    const orderAggregates = await prisma.order.groupBy({
      by: ['userId'],
      _sum: { totalAmount: true },
      _count: { _all: true },
      where: { userId: { in: customerIds } }
    });

    // Fetch wishlist counts efficiently
    const wishlistAggregates = await prisma.wishlist.findMany({
      where: { userId: { in: customerIds } },
      select: {
        userId: true,
        _count: {
          select: { items: true }
        }
      }
    });

    const orderStatsMap = new Map();
    for (const agg of orderAggregates) {
      if (agg.userId) {
        orderStatsMap.set(agg.userId, {
          totalSpend: agg._sum.totalAmount || 0,
          orderCount: agg._count._all || 0
        });
      }
    }

    const wishlistStatsMap = new Map();
    for (const wish of wishlistAggregates) {
      if (wish.userId) {
        wishlistStatsMap.set(wish.userId, wish._count?.items || 0);
      }
    }

    // Populate spend and clean up fields
    const populatedCustomers = customers.map((c) => {
      const stats = orderStatsMap.get(c.id) || { totalSpend: 0, orderCount: 0 };
      const wishlistCount = wishlistStatsMap.get(c.id) || 0;

      return {
        ...c,
        totalSpend: stats.totalSpend,
        orderCount: stats.orderCount,
        wishlistCount,
        password: undefined // Never send password
      };
    });

    return {
      customers: populatedCustomers,
      pagination: {
        totalItems,
        filteredItems,
        totalPages,
        currentPage,
        itemsPerPage: take,
        pageSize: take,
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
