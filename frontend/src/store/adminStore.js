import { create } from 'zustand';
import api from '../services/api';
import toast from 'react-hot-toast';

const useAdminStore = create((set, get) => ({
  analytics: null,
  cachedAt: null,
  activeRequest: null,
  orders: [],
  ordersPagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  },
  products: [],
  isLoading: false,
  // Per-row loading: Set of order IDs currently being updated
  updatingOrderIds: new Set(),
  error: null,
  searchQuery: '',

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setOrdersItemsPerPage: (limit) => {
    set((state) => ({
      ordersPagination: { ...state.ordersPagination, itemsPerPage: limit, currentPage: 1 }
    }));
  },

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
        return;
      }
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

  fetchOrders: async (page = 1, limit = get().ordersPagination.itemsPerPage) => {
    set({ isLoading: true, error: null });
    const { searchQuery } = get();
    try {
      const response = await api.get(`/admin/orders?page=${page}&limit=${limit}&search=${encodeURIComponent(searchQuery)}`);
      set({ 
        orders: response.data.data.orders, 
        ordersPagination: response.data.data.pagination || {
          currentPage: page,
          totalPages: 1,
          totalItems: response.data.data.orders.length,
          itemsPerPage: limit
        },
        isLoading: false 
      });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch admin orders', isLoading: false });
    }
  },

  updateOrderStatus: async (orderId, status) => {
    const prevOrders = get().orders;
    const prevAnalytics = get().analytics;
    const prevOrder = prevOrders.find(o => o.id === orderId);
    const prevStatus = prevOrder ? prevOrder.orderStatus : null;

    // 1. Optimistic update — patch only the changed row immediately
    set((state) => {
      let nextAnalytics = state.analytics;
      if (nextAnalytics && prevStatus && prevStatus !== status) {
        nextAnalytics = {
          ...nextAnalytics,
          kpis: {
            ...nextAnalytics.kpis,
            deliveredOrders: (nextAnalytics.kpis.deliveredOrders || 0) + (status === 'DELIVERED' ? 1 : 0) - (prevStatus === 'DELIVERED' ? 1 : 0),
            cancelledOrders: (nextAnalytics.kpis.cancelledOrders || 0) + (status === 'CANCELLED' ? 1 : 0) - (prevStatus === 'CANCELLED' ? 1 : 0),
          },
          statusDistribution: [...nextAnalytics.statusDistribution]
        };
        
        const prevSdIndex = nextAnalytics.statusDistribution.findIndex(sd => sd.name === prevStatus);
        if (prevSdIndex > -1) {
          nextAnalytics.statusDistribution[prevSdIndex] = { 
            ...nextAnalytics.statusDistribution[prevSdIndex], 
            value: Math.max(0, nextAnalytics.statusDistribution[prevSdIndex].value - 1) 
          };
        }
        
        const newSdIndex = nextAnalytics.statusDistribution.findIndex(sd => sd.name === status);
        if (newSdIndex > -1) {
          nextAnalytics.statusDistribution[newSdIndex] = { 
            ...nextAnalytics.statusDistribution[newSdIndex], 
            value: nextAnalytics.statusDistribution[newSdIndex].value + 1 
          };
        } else {
          nextAnalytics.statusDistribution.push({ name: status, value: 1 });
        }
      }

      return {
        orders: state.orders.map((o) =>
          o.id === orderId ? { ...o, orderStatus: status } : o
        ),
        analytics: nextAnalytics,
        updatingOrderIds: new Set([...state.updatingOrderIds, orderId]),
        error: null,
      };
    });

    try {
      await api.put(`/admin/orders/${orderId}/status`, { status });
      // Success — just clear the loading indicator for this row
      set((state) => {
        const next = new Set(state.updatingOrderIds);
        next.delete(orderId);
        return { updatingOrderIds: next };
      });
      return true;
    } catch (error) {
      // Rollback to previous state on failure
      set((state) => {
        const next = new Set(state.updatingOrderIds);
        next.delete(orderId);
        return {
          orders: prevOrders,
          analytics: prevAnalytics,
          updatingOrderIds: next,
          error: error.response?.data?.message || 'Failed to update order status',
        };
      });
      toast.error('Failed to update order status. Change has been reverted.');
      return false;
    }
  },
}));

export default useAdminStore;
