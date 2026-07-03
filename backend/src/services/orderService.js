import orderRepository from '../repositories/orderRepository.js';
import emailService from './emailService.js';
import emailEvents from '../email/utils/emailEvents.js';
import settingsService from './settingsService.js';

class OrderService {
  async checkout(userId, { shippingAddressId, billingAddressId, paymentMethod, paymentMetadata, deliveryMethod }) {
    // Entire checkout logic has been moved to a single ACID transaction in the repository
    const order = await orderRepository.executeCheckoutTransaction(
      userId, 
      shippingAddressId, 
      billingAddressId, 
      paymentMethod,
      paymentMetadata,
      deliveryMethod
    );

    // Execute background tasks asynchronously so they don't block the API response
    setImmediate(async () => {
      try {
        console.log(`[BACKGROUND] Starting payment simulation for ${order.orderNumber}...`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate payment processing delay
        console.log(`[BACKGROUND] Payment simulation completed successfully.`);

        // Emit order.created event
        emailEvents.emit('order.created', order);

        import('./cacheService.js').then(({ cacheInvalidateByPattern }) => {
          cacheInvalidateByPattern('home:*');
          cacheInvalidateByPattern('products:*');
          cacheInvalidateByPattern('admin:dashboard:*');
        });

        // Check for low stock on any of the ordered items
        const settings = await settingsService.getSettingsByKeys(['notifications']);
        const threshold = parseInt(settings.notifications?.lowStockThreshold || '5', 10);

        for (const item of order.items) {
          if (item.product && item.product.stock <= threshold) {
            emailEvents.emit('product.low_stock', { product: item.product, threshold });
          }
        }
      } catch (error) {
        console.error('Failed to execute background tasks for order:', error);
      }
    });

    return order;
  }

  async getUserOrders(userId) {
    return await orderRepository.getOrdersByUser(userId);
  }

  async getOrderById(orderId, userId) {
    const order = await orderRepository.getOrderById(orderId, userId);
    if (!order) throw new Error('Order not found');
    return order;
  }

  async updateOrderStatus(orderId, status) {
    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid order status');
    }
    const order = await orderRepository.updateOrderStatus(orderId, status);
    
    import('./cacheService.js').then(({ cacheInvalidateByPattern }) => {
      cacheInvalidateByPattern('admin:dashboard:*');
    });

    // Emit status transition events
    try {
      if (status === 'SHIPPED') {
        emailEvents.emit('order.shipped', { order });
      } else if (status === 'DELIVERED') {
        emailEvents.emit('order.delivered', { order, deliveredDate: new Date().toLocaleDateString() });
        import('./cacheService.js').then(({ cacheInvalidateByPattern }) => {
          cacheInvalidateByPattern('home:*');
          cacheInvalidateByPattern('products:*');
        });
      } else if (status === 'CANCELLED') {
        emailEvents.emit('order.cancelled', { order, cancellationReason: 'Fulfillment cancellation' });
        if (order.paymentStatus === 'PAID') {
          emailEvents.emit('order.refunded', { order, refundAmount: order.totalAmount });
        }
      }
    } catch (eventError) {
      console.error('[ORDER SERVICE] Failed to emit order status event:', eventError);
    }

    return order;
  }

  async updatePaymentStatus(orderId, status) {
    const validStatuses = ['PENDING', 'PAID', 'FAILED'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid payment status');
    }
    return await orderRepository.updatePaymentStatus(orderId, status);
  }

  async getAllOrders({ page = 1, limit = 10, search = '', status, paymentStatus, minDate, maxDate, minAmount, maxAmount, sort }) {
    // Safe integer clamping
    let take = parseInt(limit, 10);
    if (!Number.isFinite(take) || take < 1) take = 10;
    if (take > 50000) take = 50000;

    let currentPage = parseInt(page, 10);
    if (!Number.isFinite(currentPage) || currentPage < 1) currentPage = 1;

    // filteredItems = total matching current filters
    const filteredItems = await orderRepository.countAllOrders({ search, status, paymentStatus, minDate, maxDate, minAmount, maxAmount });

    // totalItems = all orders (no filters)
    const totalItemsCacheKey = 'admin:orders:total_count';
    let totalItems;
    const { cacheGet, cacheSet } = await import('./cacheService.js');
    const cachedTotal = await cacheGet(totalItemsCacheKey);
    if (cachedTotal !== null) {
      totalItems = cachedTotal;
    } else {
      totalItems = await orderRepository.countAllOrders({});
      await cacheSet(totalItemsCacheKey, totalItems, 300); // 5 mins
    }

    const totalPages = Math.max(1, Math.ceil(filteredItems / take));
    if (currentPage > totalPages) currentPage = totalPages;

    const skip = (currentPage - 1) * take;
    const orders = await orderRepository.getAllOrders({ skip, take, search, status, paymentStatus, minDate, maxDate, minAmount, maxAmount, sort });

    return {
      orders,
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        filteredItems,
        itemsPerPage: take,
        pageSize: take,
      }
    };
  }
}

export default new OrderService();
