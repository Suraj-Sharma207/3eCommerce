import adminService from '../services/adminService.js';
import { successResponse } from '../utils/response.js';
import orderController from './orderController.js';

class AdminController {
  async getDashboardAnalytics(req, res, next) {
    try {
      const data = await adminService.getDashboardAnalytics();
      return successResponse(res, 'Analytics retrieved', data, 200);
    } catch (error) {
      next(error);
    }
  }

  // Reuse order controller methods for admin
  async getAllOrders(req, res, next) {
    return orderController.getAllOrders(req, res, next);
  }

  async updateOrderStatus(req, res, next) {
    return orderController.updateOrderStatus(req, res, next);
  }
}

export default new AdminController();
