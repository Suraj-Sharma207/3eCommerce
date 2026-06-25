import orderRepository from '../repositories/orderRepository.js';
import emailService from './emailService.js';

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

        emailService.sendOrderConfirmation(order.user.email, order);
        emailService.sendNewOrderNotification('admin@ecommerce.com', order);
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
    return await orderRepository.updateOrderStatus(orderId, status);
  }

  async updatePaymentStatus(orderId, status) {
    const validStatuses = ['PENDING', 'PAID', 'FAILED'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid payment status');
    }
    return await orderRepository.updatePaymentStatus(orderId, status);
  }

  async getAllOrders({ page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;
    const take = parseInt(limit);
    
    const [orders, totalItems] = await Promise.all([
      orderRepository.getAllOrders({ skip, take }),
      orderRepository.countAllOrders()
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
