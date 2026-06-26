import orderRepository from '../repositories/orderRepository.js';
import emailService from './emailService.js';
import emailEvents from '../email/utils/emailEvents.js';
import settingsService from './settingsService.js';

class OrderService {
  async checkout(userId, { shippingAddressId, billingAddressId, paymentMethod, paymentMetadata }) {
    // Entire checkout logic has been moved to a single ACID transaction in the repository
    const order = await orderRepository.executeCheckoutTransaction(
      userId, 
      shippingAddressId, 
      billingAddressId, 
      paymentMethod,
      paymentMetadata
    );

    // Execute background tasks asynchronously so they don't block the API response
    setImmediate(async () => {
      try {
        console.log(`[BACKGROUND] Starting payment simulation for ${order.orderNumber}...`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate payment processing delay
        console.log(`[BACKGROUND] Payment simulation completed successfully.`);

        // Emit order.created event
        emailEvents.emit('order.created', order);

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
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid order status');
    }
    const order = await orderRepository.updateOrderStatus(orderId, status);

    // Emit status transition events
    try {
      if (status === 'SHIPPED') {
        emailEvents.emit('order.shipped', { order });
      } else if (status === 'DELIVERED') {
        emailEvents.emit('order.delivered', { order, deliveredDate: new Date().toLocaleDateString() });
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

  async getAllOrders({ page = 1, limit = 10, search = '' }) {
    const skip = (page - 1) * limit;
    const take = parseInt(limit);
    
    const [orders, totalItems] = await Promise.all([
      orderRepository.getAllOrders({ skip, take, search }),
      orderRepository.countAllOrders({ search })
    ]);

    return {
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / take),
        totalItems,
        itemsPerPage: take
      }
    };
  }
}

export default new OrderService();
