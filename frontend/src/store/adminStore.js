import { create } from 'zustand';
import api from '../services/api';
import toast from 'react-hot-toast';

const useAdminStore = create((set, get) => ({
  analytics: null,
  cachedAt: null,
  activeRequest: null,
  orders: [],
  products: [],
  isLoading: false,
  error: null,

  fetchAnalytics: async ({ force = false } = {}) => {
    const state = get();
    const now = Date.now();
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    // If we have cached data and it's fresh, and we aren't forcing, just return
    if (!force && state.analytics && state.cachedAt && (now - state.cachedAt < CACHE_TTL)) {
      return;
    }

    // If a request is already in-flight, cancel it before starting a new one
    if (state.activeRequest) {
      state.activeRequest.abort();
    }

    const abortController = new AbortController();
    set({ activeRequest: abortController });

    // Only show loading state if we have no existing analytics data
    if (!state.analytics) {
      set({ isLoading: true, error: null });
    }

    try {
      const response = await api.get('/admin/analytics', {
        signal: abortController.signal
      });
      set({ 
        analytics: response.data.data, 
        cachedAt: Date.now(),
        isLoading: false,
        activeRequest: null
      });
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        // Request was aborted, do nothing
        return;
      }
      // Show toast if we failed a background refresh
      if (state.analytics) {
        toast.error("Unable to refresh dashboard data.");
      }
      set({ 
        error: error.response?.data?.message || 'Failed to fetch analytics', 
        isLoading: false,
        activeRequest: null
      });
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
