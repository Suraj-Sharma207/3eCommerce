import { create } from 'zustand';
import api from '../services/api';

const useAdminStore = create((set) => ({
  analytics: null,
  orders: [],
  products: [],
  isLoading: false,
  error: null,

  fetchAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/admin/analytics');
      set({ analytics: response.data.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch analytics', isLoading: false });
    }
  },

  fetchOrders: async (page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/admin/orders?page=${page}&limit=${limit}`);
      set({ orders: response.data.data.orders, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch admin orders', isLoading: false });
    }
  },

  updateOrderStatus: async (orderId, status) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status });
      // Refetch orders after update to reflect changes
      const response = await api.get(`/admin/orders?page=1&limit=10`);
      set({ orders: response.data.data.orders, isLoading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to update order status', isLoading: false });
      return false;
    }
  }
}));

export default useAdminStore;
