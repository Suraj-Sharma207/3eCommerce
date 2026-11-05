import prisma from "../lib/prisma.js";

class UserRepository {
  async findByEmail(email) {
    return await prisma.user.findUnique({ where: { email } });
  }

  async findById(id) {
    return await prisma.user.findUnique({ where: { id } });
  }

  async findProfileById(id) {
    return await prisma.user.findUnique({
      where: { id },
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
        createdAt: true,
        updatedAt: true,
      },
    });
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
    const [totalOrders, pendingOrders, completedOrders, wishlistData] =
      await Promise.all([
        prisma.order.count({ where: { userId } }),
        prisma.order.count({ where: { userId, orderStatus: "PENDING" } }),
        prisma.order.count({ where: { userId, orderStatus: "DELIVERED" } }),
        prisma.wishlist.findUnique({
          where: { userId },
          include: { _count: { select: { items: true } } },
        }),
      ]);

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      wishlistCount: wishlistData?._count?.items || 0,
    };
  }
}

export default new UserRepository();
