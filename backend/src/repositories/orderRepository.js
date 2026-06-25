import prisma from '../lib/prisma.js';

class OrderRepository {
  async executeCheckoutTransaction(userId, shippingAddressId, billingAddressId, paymentMethod, paymentMetadata) {
    // 1. Non-database pre-work / Validations outside the transaction
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw { status: 401, message: 'Unauthorized user' };

    const shippingAddress = await prisma.address.findUnique({ where: { id: shippingAddressId } });
    const billingAddress = billingAddressId ? await prisma.address.findUnique({ where: { id: billingAddressId } }) : shippingAddress;
    
    if (!shippingAddress || !billingAddress) {
      throw { status: 400, message: 'Invalid shipping or billing address' };
    }

    // Load cart outside the transaction to know which products we need
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true }
    });

    if (!cart || cart.items.length === 0) {
      throw { status: 400, message: 'Cart is empty' };
    }

    // Generate Order Number outside transaction
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(100000 + Math.random() * 900000); 
    const orderNumber = `ORD-${datePart}-${randomPart}`;

    const startTime = Date.now();
    console.log(`[CHECKOUT] Starting transaction for ${orderNumber}...`);

    // 2. Atomic Transaction (Keep as small as possible)
    const order = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData = [];

      // Fetch all products at once to solve N+1 issue
      const productIds = cart.items.map(item => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } }
      });
      const productMap = new Map(products.map(p => [p.id, p]));

      // Validate stock in memory
      for (const item of cart.items) {
        const product = productMap.get(item.productId);
        
        if (!product || !product.active) {
          throw { status: 409, message: `Product ${product?.name || item.productId} is no longer available` };
        }
        
        if (product.stock < item.quantity) {
          throw { status: 409, message: `Insufficient stock for ${product.name}. Available: ${product.stock}` };
        }

        const price = product.finalPrice || product.price;
        totalAmount += price * item.quantity;
        
        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          price
        });
      }

      const shippingCost = totalAmount > 4999 ? 0 : 499;
      totalAmount += shippingCost;

      // Reduce inventory sequentially
      for (const item of cart.items) {
        const product = productMap.get(item.productId);
        const newStock = product.stock - item.quantity;
        const isSoldOut = newStock <= 0;
        
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: newStock,
            active: isSoldOut ? false : product.active
          }
        });
      }

      // Create Order and Items
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          totalAmount,
          shippingAddress: shippingAddress,
          billingAddress: billingAddress,
          paymentMethod,
          paymentStatus: 'PAID', // Assessment mode
          orderStatus: 'CONFIRMED', // Assessment mode
          transactionRef: paymentMetadata.transactionRef || `TXN-${Date.now()}`,
          cardBrand: paymentMetadata.cardBrand,
          last4Digits: paymentMetadata.last4Digits,
          maskedUPI: paymentMetadata.maskedUPI,
          items: {
            create: orderItemsData
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

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      return createdOrder;
    });

    const duration = Date.now() - startTime;
    console.log(`[CHECKOUT] Transaction committed for ${orderNumber} in ${duration}ms`);

    // Attach user to order for downstream email service
    order.user = user;

    return order;
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
