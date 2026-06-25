import prisma from '../lib/prisma.js';

class UserRepository {
  async findByEmail(email) {
    return await prisma.user.findUnique({ where: { email } });
  }

  async findById(id) {
    return await prisma.user.findUnique({ where: { id } });
  }

  async create(userData) {
    return await prisma.user.create({ data: userData });
  }

  async update(id, data) {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  async getProfileStats(userId) {
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      wishlistData
    ] = await Promise.all([
      prisma.order.count({ where: { userId } }),
      prisma.order.count({ where: { userId, orderStatus: 'PENDING' } }),
      prisma.order.count({ where: { userId, orderStatus: 'PROCESSING' } }),
      prisma.order.count({ where: { userId, orderStatus: 'SHIPPED' } }),
      prisma.order.count({ where: { userId, orderStatus: 'DELIVERED' } }),
      prisma.order.count({ where: { userId, orderStatus: 'CANCELLED' } }),
      prisma.wishlist.findUnique({
        where: { userId },
        include: { _count: { select: { items: true } } }
      })
    ]);

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      wishlistCount: wishlistData?._count?.items || 0
    };
  }
}

export default new UserRepository();
