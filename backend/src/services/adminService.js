import adminRepository from '../repositories/adminRepository.js';

class AdminService {
  async getDashboardAnalytics(timeFilter = '7d') {
    const data = await adminRepository.getDashboardMetrics(timeFilter);

    // Group revenue & orders by date bucket
    const revenueTrendMap = {};
    const now = new Date();
    let formatKey = (d) => d.toISOString().split('T')[0];

    if (timeFilter === 'today') {
      // 24 hours
      for (let i = 0; i < 24; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), i, 0, 0);
        revenueTrendMap[`${i.toString().padStart(2, '0')}:00`] = { revenue: 0, orders: 0 };
      }
      formatKey = (d) => `${d.getHours().toString().padStart(2, '0')}:00`;
    } else if (timeFilter === '30d') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        revenueTrendMap[d.toISOString().split('T')[0]] = { revenue: 0, orders: 0 };
      }
    } else if (timeFilter === 'monthly') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        revenueTrendMap[`${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}`] = { revenue: 0, orders: 0 };
      }
      formatKey = (d) => `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}`;
    } else if (timeFilter === 'yearly') {
      for (let i = 4; i >= 0; i--) {
        const y = now.getFullYear() - i;
        revenueTrendMap[y.toString()] = { revenue: 0, orders: 0 };
      }
      formatKey = (d) => d.getFullYear().toString();
    } else {
      // 7d default
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        revenueTrendMap[d.toISOString().split('T')[0]] = { revenue: 0, orders: 0 };
      }
    }

    data.recentPaidOrders.forEach(order => {
      const dateKey = formatKey(order.createdAt);
      if (revenueTrendMap[dateKey] !== undefined) {
        revenueTrendMap[dateKey].revenue += order.totalAmount;
        revenueTrendMap[dateKey].orders += 1;
      }
    });

    const revenueTrend = Object.keys(revenueTrendMap).map(date => ({
      date,
      revenue: revenueTrendMap[date].revenue,
      orders: revenueTrendMap[date].orders
    }));

    const statusDistribution = data.orderStatuses.map(status => ({
      name: status.orderStatus,
      value: status._count.orderStatus
    }));

    const deliveredOrders = data.orderStatuses.find(s => s.orderStatus === 'DELIVERED')?._count?.orderStatus || 0;
    const cancelledOrders = data.orderStatuses.find(s => s.orderStatus === 'CANCELLED')?._count?.orderStatus || 0;

    return {
      kpis: {
        revenue: data.revenue,
        orders: data.orders,
        customers: data.customers,
        products: data.products,
        deliveredOrders,
        cancelledOrders
      },
      revenueTrend,
      statusDistribution,
      recentOrders: data.recentOrders,
      orderStatuses: statusDistribution,
      topProducts: data.topProducts,
      mostViewed: data.mostViewed,
      highestRevenue: data.highestRevenue,
      highestSelling: data.highestSelling,
      mostWishlisted: data.mostWishlisted,
      mostAddedToCart: data.mostAddedToCart,
      lowestStock: data.lowestStock,
      neverSold: data.neverSold
    };
  }

  async getAllCustomers(queryParams) {
    return await adminRepository.getAllCustomers(queryParams);
  }

  async getCustomerById(id) {
    return await adminRepository.getCustomerById(id);
  }

  async updateCustomerStatus(id, active) {
    return await adminRepository.updateCustomerStatus(id, active);
  }

  async getRevenueAnalytics() { return await adminRepository.getRevenueAnalytics(); }
  async getInventoryAlerts() { return await adminRepository.getInventoryAlerts(); }
  async getOrdersAnalytics() { return await adminRepository.getOrdersAnalytics(); }
  async getCustomersAnalytics() { return await adminRepository.getCustomersAnalytics(); }
  async getProductsAnalytics() { return await adminRepository.getProductsAnalytics(); }
  async getDeliveriesAnalytics() { return await adminRepository.getDeliveriesAnalytics(); }
  async getCancellationsAnalytics() { return await adminRepository.getCancellationsAnalytics(); }

  async getOrderById(orderId) {
    return await adminRepository.getOrderById(orderId);
  }
}

export default new AdminService();
