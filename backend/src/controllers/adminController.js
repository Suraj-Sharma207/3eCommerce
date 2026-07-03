import adminService from '../services/adminService.js';
import { successResponse } from '../utils/response.js';
import orderController from './orderController.js';
import { cacheGet, cacheSet } from '../services/cacheService.js';

class AdminController {
  async getDashboardAnalytics(req, res, next) {
    try {
      const timeFilter = req.query.timeFilter || '7d';
      const cacheKey = `admin:dashboard:legacy:${timeFilter}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return successResponse(res, 'Analytics retrieved (cached)', cached, 200);

      const data = await adminService.getDashboardAnalytics(timeFilter);
      await cacheSet(cacheKey, data, 300); // 5 mins
      return successResponse(res, 'Analytics retrieved', data, 200);
    } catch (error) {
      console.error('Dashboard Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getKpis(req, res, next) {
    try {
      const cacheKey = 'admin:dashboard:kpis';
      const cached = await cacheGet(cacheKey);
      if (cached) return successResponse(res, 'KPIs retrieved (cached)', cached, 200);

      const data = await adminService.getKpis();
      await cacheSet(cacheKey, data, 300); // 5 mins
      return successResponse(res, 'KPIs retrieved', data, 200);
    } catch (error) {
      next(error);
    }
  }

  async getRecentOrders(req, res, next) {
    try {
      const cacheKey = 'admin:dashboard:recent-orders';
      const cached = await cacheGet(cacheKey);
      if (cached) return successResponse(res, 'Recent orders retrieved (cached)', cached, 200);

      const data = await adminService.getRecentOrders();
      await cacheSet(cacheKey, data, 30); // 30 secs
      return successResponse(res, 'Recent orders retrieved', data, 200);
    } catch (error) {
      next(error);
    }
  }

  async getTopProducts(req, res, next) {
    try {
      const cacheKey = 'admin:dashboard:top-products';
      const cached = await cacheGet(cacheKey);
      if (cached) return successResponse(res, 'Top products retrieved (cached)', cached, 200);

      const data = await adminService.getTopProducts();
      await cacheSet(cacheKey, data, 30); // 30 secs
      return successResponse(res, 'Top products retrieved', data, 200);
    } catch (error) {
      next(error);
    }
  }

  async getOrderStatuses(req, res, next) {
    try {
      const cacheKey = 'admin:dashboard:order-statuses';
      const cached = await cacheGet(cacheKey);
      if (cached) return successResponse(res, 'Order statuses retrieved (cached)', cached, 200);

      const data = await adminService.getOrderStatuses();
      await cacheSet(cacheKey, data, 300); // 5 mins
      return successResponse(res, 'Order statuses retrieved', data, 200);
    } catch (error) {
      next(error);
    }
  }

  async getExtendedStats(req, res, next) {
    try {
      const cacheKey = 'admin:dashboard:extended-stats';
      const cached = await cacheGet(cacheKey);
      if (cached) return successResponse(res, 'Extended stats retrieved (cached)', cached, 200);

      const data = await adminService.getExtendedStats();
      await cacheSet(cacheKey, data, 300); // 5 mins
      return successResponse(res, 'Extended stats retrieved', data, 200);
    } catch (error) {
      next(error);
    }
  }

  async getRevenueAnalytics(req, res, next) {
    try {
      const cacheKey = 'admin:dashboard:revenue-analytics';
      const cached = await cacheGet(cacheKey);
      if (cached) return successResponse(res, 'Revenue analytics retrieved (cached)', cached, 200);

      const data = await adminService.getRevenueAnalytics();
      await cacheSet(cacheKey, data, 300); // 5 mins
      return successResponse(res, 'Revenue analytics retrieved', data, 200);
    } catch (error) {
      console.error('Revenue Analytics Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getInventoryAlerts(req, res, next) {
    try {
      const cacheKey = 'admin:dashboard:inventory-alerts';
      const cached = await cacheGet(cacheKey);
      if (cached) return successResponse(res, 'Inventory alerts retrieved (cached)', cached, 200);

      const data = await adminService.getInventoryAlerts();
      await cacheSet(cacheKey, data, 60); // 1 min (60 secs)
      return successResponse(res, 'Inventory alerts retrieved', data, 200);
    } catch (error) {
      console.error('Inventory Alerts Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getOrdersAnalytics(req, res, next) {
    try {
      const cacheKey = 'admin:dashboard:orders-analytics';
      const cached = await cacheGet(cacheKey);
      if (cached) return successResponse(res, 'Orders analytics retrieved (cached)', cached, 200);

      const data = await adminService.getOrdersAnalytics();
      await cacheSet(cacheKey, data, 300); // 5 mins
      return successResponse(res, 'Orders analytics retrieved', data, 200);
    } catch (error) {
      console.error('Orders Analytics Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getCustomersAnalytics(req, res, next) {
    try {
      const cacheKey = 'admin:dashboard:customers-analytics';
      const cached = await cacheGet(cacheKey);
      if (cached) return successResponse(res, 'Customers analytics retrieved (cached)', cached, 200);

      const data = await adminService.getCustomersAnalytics();
      await cacheSet(cacheKey, data, 300); // 5 mins
      return successResponse(res, 'Customers analytics retrieved', data, 200);
    } catch (error) {
      console.error('Customers Analytics Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getProductsAnalytics(req, res, next) {
    try {
      const cacheKey = 'admin:dashboard:products-analytics';
      const cached = await cacheGet(cacheKey);
      if (cached) return successResponse(res, 'Products analytics retrieved (cached)', cached, 200);

      const data = await adminService.getProductsAnalytics();
      await cacheSet(cacheKey, data, 300); // 5 mins
      return successResponse(res, 'Products analytics retrieved', data, 200);
    } catch (error) {
      console.error('Products Analytics Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDeliveriesAnalytics(req, res, next) {
    try {
      const cacheKey = 'admin:dashboard:deliveries-analytics';
      const cached = await cacheGet(cacheKey);
      if (cached) return successResponse(res, 'Deliveries analytics retrieved (cached)', cached, 200);

      const data = await adminService.getDeliveriesAnalytics();
      await cacheSet(cacheKey, data, 300); // 5 mins
      return successResponse(res, 'Deliveries analytics retrieved', data, 200);
    } catch (error) {
      console.error('Deliveries Analytics Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getCancellationsAnalytics(req, res, next) {
    try {
      const cacheKey = 'admin:dashboard:cancellations-analytics';
      const cached = await cacheGet(cacheKey);
      if (cached) return successResponse(res, 'Cancellations analytics retrieved (cached)', cached, 200);

      const data = await adminService.getCancellationsAnalytics();
      await cacheSet(cacheKey, data, 300); // 5 mins
      return successResponse(res, 'Cancellations analytics retrieved', data, 200);
    } catch (error) {
      console.error('Cancellations Analytics Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Reuse order controller methods for admin
  async getAllOrders(req, res, next) {
    try {
      const { page = 1, limit = 10, search = '', status, paymentStatus, minDate, maxDate, minAmount, maxAmount, sort } = req.query;
      
      const cacheKey = `admin:orders:page=${page}:limit=${limit}:search=${search}:status=${status || 'all'}:payment=${paymentStatus || 'all'}:sort=${sort || 'newest'}:minD=${minDate || ''}:maxD=${maxDate || ''}:minA=${minAmount || ''}:maxA=${maxAmount || ''}`;
      
      const cached = await cacheGet(cacheKey);
      if (cached) return successResponse(res, 'All orders retrieved (cached)', cached, 200);

      // We import adminService for consistency if needed, but it currently uses orderController. 
      // We should use adminService if it exists, or just import orderService directly since adminController shouldn't ideally call orderController. 
      // I'll stick to orderService directly since orderController is what it delegated to before.
      const { default: orderService } = await import('../services/orderService.js');
      const data = await orderService.getAllOrders({ page, limit, search, status, paymentStatus, minDate, maxDate, minAmount, maxAmount, sort });
      
      await cacheSet(cacheKey, data, 60); // 60 seconds TTL

      return successResponse(res, 'All orders retrieved', data, 200);
    } catch (error) {
      next(error);
    }
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

  /**
   * Returns all matching product IDs without pagination — used by the
   * frontend "Select All" checkbox to select across the entire dataset.
   */
  async getFilteredProductIds(req, res, next) {
    try {
      const { search, category, brand, minRating, minPrice, maxPrice, inStock, stockStatus, sort, featured, trending, newArrival, bestSeller, recommended, sale } = req.query;
      const { default: productService } = await import('../services/productService.js');
      const ids = await productService.getFilteredProductIds({ search, category, brand, minRating, minPrice, maxPrice, inStock, stockStatus, sort, featured, trending, newArrival, bestSeller, recommended, sale, isAdmin: true });
      return successResponse(res, 'Filtered product IDs retrieved', { ids }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk delete products by IDs — admin only, transactional.
   * Body: { productIds: string[] }
   */
  async bulkDeleteProducts(req, res, next) {
    try {
      const { productIds } = req.body;
      if (!Array.isArray(productIds) || productIds.length === 0) {
        const { errorResponse } = await import('../utils/response.js');
        return errorResponse(res, 'productIds must be a non-empty array', [], 400);
      }
      const { default: productService } = await import('../services/productService.js');
      const result = await productService.bulkDeleteProducts(productIds);
      return successResponse(res, `${result.deleted} product(s) deleted successfully`, result, 200);
    } catch (error) {
      if (error.statusCode) {
        const { errorResponse } = await import('../utils/response.js');
        return errorResponse(res, error.message, [], error.statusCode);
      }
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    return orderController.updateOrderStatus(req, res, next);
  }

  async getAllCustomers(req, res, next) {
    try {
      const { page, limit, search, status, minDate, maxDate, sort } = req.query;
      const data = await adminService.getAllCustomers({ page, limit, search, status, minDate, maxDate, sort });
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
