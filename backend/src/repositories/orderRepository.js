import prisma from '../lib/prisma.js';

class OrderRepository {
  async createOrder(userId, items, totalAmount) {
    return await prisma.order.create({
      data: {
        userId,
        totalAmount,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING',
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }

  async getOrdersByUser(userId) {
    return await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getOrderById(orderId, userId = null) {
    const where = { id: orderId };
    if (userId) where.userId = userId;

    return await prisma.order.findUnique({
      where,
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }

  async updateOrderStatus(orderId, status) {
    return await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus: status },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }

  async updatePaymentStatus(orderId, status) {
    return await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: status }
    });
  }

  async getAllOrders({ skip, take }) {
    return await prisma.order.findMany({
      skip,
      take,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async countAllOrders() {
    return await prisma.order.count();
  }
}

export default new OrderRepository();
