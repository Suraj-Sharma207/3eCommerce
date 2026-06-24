import orderService from '../services/orderService.js';
import { successResponse } from '../utils/response.js';

class OrderController {
  async checkout(req, res, next) {
    try {
      const order = await orderService.checkout(req.user.id);
      return successResponse(res, 'Order placed successfully', order, 201);
    } catch (error) {
      next(error);
    }
  }

  async getUserOrders(req, res, next) {
    try {
      const orders = await orderService.getUserOrders(req.user.id);
      return successResponse(res, 'Orders retrieved successfully', orders, 200);
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id, req.user.id);
      return successResponse(res, 'Order retrieved successfully', order, 200);
    } catch (error) {
      next(error);
    }
  }

  // Admin Routes Below
  async getAllOrders(req, res, next) {
    try {
      const { page, limit } = req.query;
      const data = await orderService.getAllOrders({ page, limit });
      return successResponse(res, 'All orders retrieved', data, 200);
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const order = await orderService.updateOrderStatus(id, status);
      return successResponse(res, 'Order status updated', order, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new OrderController();
