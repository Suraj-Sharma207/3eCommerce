import prisma from '../lib/prisma.js';

class AdminRepository {
  async getDashboardMetrics() {
    const totalRevenue = await prisma.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { totalAmount: true }
    });

    const totalOrders = await prisma.order.count();
    const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const totalProducts = await prisma.product.count();

    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
        price: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    });

    // Populate top products with details
    const populatedTopProducts = await Promise.all(
      topProducts.map(async (tp) => {
        const product = await prisma.product.findUnique({ where: { id: tp.productId } });
        return {
          product,
          totalSold: tp._sum.quantity,
          revenue: tp._sum.price
        };
      })
    );

    // Revenue Trend (last 7 days for now, mock logic for aggregation)
    // Normally you'd group by day, but Prisma doesn't natively do DATE() grouping easily across all DBs
    // so we'll fetch recent paid orders and group in JS.
    const recentPaidOrders = await prisma.order.findMany({
      where: { 
        paymentStatus: 'PAID',
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7))
        }
      },
      select: { totalAmount: true, createdAt: true }
    });

    const orderStatuses = await prisma.order.groupBy({
      by: ['orderStatus'],
      _count: {
        orderStatus: true
      }
    });

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
}

export default new AdminRepository();
