import adminService from '../services/adminService.js';
import { successResponse } from '../utils/response.js';
import orderController from './orderController.js';

class AdminController {
  async getDashboardAnalytics(req, res, next) {
    try {
      const timeFilter = req.query.timeFilter || '7d';
      const data = await adminService.getDashboardAnalytics(timeFilter);
      return successResponse(res, 'Analytics retrieved', data, 200);
    } catch (error) {
      console.error('Dashboard Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getRevenueAnalytics(req, res, next) {
    try {
      const data = await adminService.getRevenueAnalytics();
      return successResponse(res, 'Revenue analytics retrieved', data, 200);
    } catch (error) {
      console.error('Revenue Analytics Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getInventoryAlerts(req, res, next) {
    try {
      const data = await adminService.getInventoryAlerts();
      return successResponse(res, 'Inventory alerts retrieved', data, 200);
    } catch (error) {
      console.error('Inventory Alerts Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getOrdersAnalytics(req, res, next) {
    try {
      const data = await adminService.getOrdersAnalytics();
      return successResponse(res, 'Orders analytics retrieved', data, 200);
    } catch (error) {
      console.error('Orders Analytics Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getCustomersAnalytics(req, res, next) {
    try {
      const data = await adminService.getCustomersAnalytics();
      return successResponse(res, 'Customers analytics retrieved', data, 200);
    } catch (error) {
      console.error('Customers Analytics Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getProductsAnalytics(req, res, next) {
    try {
      const data = await adminService.getProductsAnalytics();
      return successResponse(res, 'Products analytics retrieved', data, 200);
    } catch (error) {
      console.error('Products Analytics Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDeliveriesAnalytics(req, res, next) {
    try {
      const data = await adminService.getDeliveriesAnalytics();
      return successResponse(res, 'Deliveries analytics retrieved', data, 200);
    } catch (error) {
      console.error('Deliveries Analytics Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getCancellationsAnalytics(req, res, next) {
    try {
      const data = await adminService.getCancellationsAnalytics();
      return successResponse(res, 'Cancellations analytics retrieved', data, 200);
    } catch (error) {
      console.error('Cancellations Analytics Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Reuse order controller methods for admin
  async getAllOrders(req, res, next) {
    return orderController.getAllOrders(req, res, next);
  }

  async getAllProducts(req, res, next) {
    try {
      const { page, limit, search, category, brand, minRating, minPrice, maxPrice, inStock, stockStatus, sort, featured, trending, newArrival, bestSeller, recommended, sale, includeInventoryCounts } = req.query;
      // We must import productService at the top of the file.
      const { default: productService } = await import('../services/productService.js');
      const data = await productService.getProducts({ page, limit, search, category, brand, minRating, minPrice, maxPrice, inStock, stockStatus, sort, featured, trending, newArrival, bestSeller, recommended, sale, includeInventoryCounts, isAdmin: true });
      return successResponse(res, 'Admin products retrieved successfully', data, 200);
    } catch (error) {
      next(error);
    }
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

  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const data = await adminService.getOrderById(id);
      if (!data) return res.status(404).json({ success: false, message: 'Order not found' });
      return successResponse(res, 'Order details retrieved', data, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
