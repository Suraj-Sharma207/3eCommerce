import prisma from '../lib/prisma.js';
import promotionService from '../services/promotionService.js';
import settingsService from '../services/settingsService.js';
import { mapProduct } from '../utils/productMapper.js';

const PRODUCT_WITH_IMAGES = {
  include: { images: { orderBy: { displayOrder: 'asc' } } }
};

const mapOrderItem = (item) => ({
  ...item,
  product: item.product ? mapProduct(item.product) : null,
});

const mapOrder = (order) => {
  if (!order) return null;
  return {
    ...order,
    items: (order.items || []).map(mapOrderItem),
  };
};

class OrderRepository {
  async executeCheckoutTransaction(userId, shippingAddressId, billingAddressId, paymentMethod, paymentMetadata, deliveryMethod = 'standard') {
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

    // 2. Pre-compute promotions and prices OUTSIDE the transaction to prevent P2028 timeout
    const activePromotions = await promotionService.getActivePromotions();

    // Fetch all products outside the transaction
    const productIds = cart.items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    // Validate stock and compute prices before entering the transaction
    let preComputedTotal = 0;
    const orderItemsData = [];

    for (const item of cart.items) {
      const product = productMap.get(item.productId);

      if (!product || !product.active) {
        throw { status: 409, message: `Product ${product?.name || item.productId} is no longer available` };
      }

      if (product.stock < item.quantity) {
        throw { status: 409, message: `Insufficient stock for ${product.name}. Available: ${product.stock}` };
      }

      const { finalPrice } = await promotionService.calculateProductPrice(product, activePromotions);
      preComputedTotal += finalPrice * item.quantity;
      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: finalPrice
      });
    }

    // Fetch shipping settings from DB
    const { shipping } = await settingsService.getSettingsByKeys(['shipping']);
    const freeShippingThreshold = shipping?.freeShippingThreshold ?? Infinity;
    const standardDeliveryCharge = shipping?.standardDeliveryCharge ?? 499;

    let shippingCost = preComputedTotal >= freeShippingThreshold ? 0 : standardDeliveryCharge;
    let estimatedDelivery = "3-5 Business Days";

    if (deliveryMethod === 'express') {
      shippingCost = 149;
      estimatedDelivery = "1-2 Business Days";
    }

    const grandTotal = preComputedTotal + shippingCost;

    // 3. Atomic Transaction — only pure DB writes, no external calls
    const order = await prisma.$transaction(async (tx) => {
      // Reduce inventory sequentially using pre-computed productMap
      for (const item of cart.items) {
        const product = productMap.get(item.productId);
        const newStock = product.stock - item.quantity;

        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: Math.max(0, newStock),
            totalSold: { increment: item.quantity },
            totalRevenue: { increment: item.quantity * product.finalPrice },
            lastPurchasedAt: new Date()
          }
        });
      }

      // Create Order and Items using pre-computed totals
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          totalAmount: grandTotal,
          subtotal: preComputedTotal,
          discountAmount: 0,
          taxAmount: 0,
          shippingCharge: shippingCost,
          deliveryMethod,
          estimatedDelivery,
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
              product: PRODUCT_WITH_IMAGES,
            }
          }
        }
      });

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      return createdOrder;
    }, { timeout: 15000 });


    const duration = Date.now() - startTime;
    console.log(`[CHECKOUT] Transaction committed for ${orderNumber} in ${duration}ms`);

    // Attach user to order for downstream email service
    order.user = user;

    return mapOrder(order);
  }

  async getOrdersByUser(userId) {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: PRODUCT_WITH_IMAGES,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return orders.map(mapOrder);
  }

  async getOrderById(orderId, userId = null) {
    const where = { id: orderId };
    if (userId) where.userId = userId;

    const order = await prisma.order.findUnique({
      where,
      include: {
        items: {
          include: {
            product: PRODUCT_WITH_IMAGES,
          }
        }
      }
    });
    return mapOrder(order);
  }

  async updateOrderStatus(orderId, status) {
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });
      if (!existing) throw new Error('Order not found');

      const previousStatus = existing.orderStatus;
      
      const order = await tx.order.update({
        where: { id: orderId },
        data: { orderStatus: status },
        include: {
          user: true,
          items: {
            include: {
              product: PRODUCT_WITH_IMAGES,
            }
          }
        }
      });

      if (previousStatus !== 'DELIVERED' && status === 'DELIVERED') {
        const updatePromises = order.items
          .filter(item => item.product)
          .map(item => 
            tx.product.update({
              where: { id: item.productId },
              data: {
                totalSold: { increment: item.quantity },
                totalRevenue: { increment: item.price * item.quantity },
                lastPurchasedAt: new Date()
              }
            })
          );
        
        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
        }
      }
      return order;
    }, {
      maxWait: 10000, // default is 2000
      timeout: 30000, // default is 5000
    });

    return mapOrder(updatedOrder);
  }

  async updatePaymentStatus(orderId, status) {
    return await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: status }
    });
  }

  async getAllOrders({ skip, take, search, status, paymentStatus, minDate, maxDate, minAmount, maxAmount, sort }) {
    const where = {};
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }
    if (status && status !== 'All') where.orderStatus = status;
    if (paymentStatus && paymentStatus !== 'All') where.paymentStatus = paymentStatus;
    
    if (minDate || maxDate) {
      where.createdAt = {};
      if (minDate) where.createdAt.gte = new Date(minDate);
      if (maxDate) {
        const endDate = new Date(maxDate);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }
    
    if (minAmount || maxAmount) {
      where.totalAmount = {};
      if (minAmount) where.totalAmount.gte = parseFloat(minAmount);
      if (maxAmount) where.totalAmount.lte = parseFloat(maxAmount);
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (sort === 'amount_desc') orderBy = { totalAmount: 'desc' };
    if (sort === 'amount_asc') orderBy = { totalAmount: 'asc' };

    return await prisma.order.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        totalAmount: true,
        paymentStatus: true,
        orderStatus: true,
        userId: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy
    });
  }

  async countAllOrders({ search, status, paymentStatus, minDate, maxDate, minAmount, maxAmount } = {}) {
    const where = {};
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }
    if (status && status !== 'All') where.orderStatus = status;
    if (paymentStatus && paymentStatus !== 'All') where.paymentStatus = paymentStatus;
    
    if (minDate || maxDate) {
      where.createdAt = {};
      if (minDate) where.createdAt.gte = new Date(minDate);
      if (maxDate) {
        const endDate = new Date(maxDate);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }
    
    if (minAmount || maxAmount) {
      where.totalAmount = {};
      if (minAmount) where.totalAmount.gte = parseFloat(minAmount);
      if (maxAmount) where.totalAmount.lte = parseFloat(maxAmount);
    }

    return await prisma.order.count({ where });
  }
}

export default new OrderRepository();
