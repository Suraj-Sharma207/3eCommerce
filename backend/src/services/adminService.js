import adminRepository from '../repositories/adminRepository.js';

class AdminService {
  async getDashboardAnalytics() {
    const data = await adminRepository.getDashboardMetrics();

    // Group revenue by date
    const revenueTrendMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      revenueTrendMap[d.toISOString().split('T')[0]] = 0;
    }

    data.recentPaidOrders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (revenueTrendMap[dateKey] !== undefined) {
        revenueTrendMap[dateKey] += order.totalAmount;
      }
    });

    const revenueTrend = Object.keys(revenueTrendMap).map(date => ({
      date,
      revenue: revenueTrendMap[date]
    }));

    const statusDistribution = data.orderStatuses.map(status => ({
      name: status.orderStatus,
      value: status._count.orderStatus
    }));

    return {
      kpis: {
        revenue: data.revenue,
        orders: data.orders,
        customers: data.customers,
        products: data.products
      },
      revenueTrend,
      statusDistribution,
      recentOrders: data.recentOrders,
      topProducts: data.topProducts
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
}

export default new AdminService();
