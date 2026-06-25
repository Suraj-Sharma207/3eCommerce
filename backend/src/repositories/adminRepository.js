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
        select: { id: true, name: true, thumbnail: true }
      });
      
      const productMap = products.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});

      populatedTopProducts = topProducts.map(tp => ({
        product: productMap[tp.productId],
        totalSold: tp._sum.quantity,
        revenue: tp._sum.price
      }));
    }
    if (isDev) console.timeEnd('Top Products Details Fetch');

    return {
      revenue: totalRevenue._sum.totalAmount || 0,
      orders: totalOrders,
      customers: totalCustomers,
      products: totalProducts,
      recentOrders,
      topProducts: populatedTopProducts,
      recentPaidOrders,
      orderStatuses
    };
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
