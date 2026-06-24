import orderRepository from '../repositories/orderRepository.js';
import cartRepository from '../repositories/cartRepository.js';

class OrderService {
  async checkout(userId) {
    const cart = await cartRepository.getCartByUserId(userId);
    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Calculate total and prepare items
    let totalAmount = 0;
    const orderItems = cart.items.map(item => {
      const price = item.product.price;
      totalAmount += price * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price
      };
    });

    // Create order
    const order = await orderRepository.createOrder(userId, orderItems, totalAmount);

    // Clear cart after successful order
    await cartRepository.clearCart(cart.id);

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
