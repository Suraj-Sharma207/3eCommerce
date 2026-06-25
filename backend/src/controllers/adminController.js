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

  async getAllCustomers(req, res, next) {
    try {
      const { page, limit, search } = req.query;
      const data = await adminService.getAllCustomers({ page, limit, search });
      return successResponse(res, 'Customers retrieved', data, 200);
    } catch (error) {
      next(error);
    }
  }

  async getCustomerById(req, res, next) {
    try {
      const { id } = req.params;
      const data = await adminService.getCustomerById(id);
      if (!data) return res.status(404).json({ success: false, message: 'Customer not found' });
      return successResponse(res, 'Customer details retrieved', data, 200);
    } catch (error) {
      next(error);
    }
  }

  async updateCustomerStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { active } = req.body;
      const data = await adminService.updateCustomerStatus(id, active);
      return successResponse(res, 'Customer status updated', data, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
