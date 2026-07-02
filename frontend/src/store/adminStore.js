import { create } from 'zustand';
import api from '../services/api';
import toast from 'react-hot-toast';
import axios from 'axios';

let ordersAbortController = null;

const useAdminStore = create((set, get) => ({
  analytics: null,
  inventoryAlerts: null,
  inventoryAlertsError: null,
  cachedAt: null,
  activeRequest: null,
  
  // Detailed Analytics Caches
  detailedAnalytics: {
    revenue: null,
    orders: null,
    customers: null,
    products: null,
    deliveries: null,
    cancellations: null
  },
  detailedLoading: {
    revenue: false,
    orders: false,
    customers: false,
    products: false,
    deliveries: false,
    cancellations: false
  },
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
      const response = await api.get('/admin/dashboard', {
        signal: abortController.signal
      });
      set({ 
        analytics: response.data?.data || response.data, 
        cachedAt: now,
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

  fetchRevenueChartData: async (timeFilter) => {
    try {
      const response = await api.get(`/admin/dashboard?timeFilter=${timeFilter}`);
      const data = response.data?.data || response.data;
      set(state => ({
        analytics: {
          ...state.analytics,
          revenueTrend: data.revenueTrend
        }
      }));
    } catch (error) {
      console.error('Failed to fetch revenue chart data', error);
    }
  },

  fetchInventoryAlerts: async () => {
    set({ inventoryAlertsError: null });
    try {
      const response = await api.get('/admin/dashboard/inventory-alerts');
      set({ inventoryAlerts: response.data?.data || response.data });
    } catch (error) {
      console.error('Failed to fetch inventory alerts', error);
      set({ inventoryAlertsError: error.response?.data?.message || 'Failed to fetch inventory alerts' });
    }
  },

  // Generic fetcher for detailed analytics drawers
  fetchDetailedAnalytics: async (type, { force = false } = {}) => {
    const state = get();
    
    // Simple caching (if we already have it, don't refetch unless forced)
    if (!force && state.detailedAnalytics[type]) {
      return;
    }

    set(state => ({
      detailedLoading: { ...state.detailedLoading, [type]: true }
    }));

    try {
      const response = await api.get(`/admin/dashboard/${type}`);
      set(state => ({
        detailedAnalytics: { ...state.detailedAnalytics, [type]: response.data?.data || response.data },
        detailedLoading: { ...state.detailedLoading, [type]: false }
      }));
    } catch (error) {
      console.error(`Failed to fetch ${type} analytics:`, error);
      toast.error(`Failed to load ${type} analytics`);
      set(state => ({
        detailedLoading: { ...state.detailedLoading, [type]: false }
      }));
    }
  },

  fetchOrders: async (page = get().ordersPagination.currentPage, overrideParams = {}) => {
    if (ordersAbortController) {
      ordersAbortController.abort();
    }
    ordersAbortController = new AbortController();

    set({ isLoading: true, error: null });
    const { searchQuery, ordersPagination } = get();
    const limit = ordersPagination.itemsPerPage;
    
    // Support URL search param and filters overrides
    const effectiveSearch = overrideParams.search !== undefined ? overrideParams.search : searchQuery;
    const filters = overrideParams.filters || {};
    
    // Construct query params
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    if (effectiveSearch) queryParams.append('search', effectiveSearch);
    if (filters.status && filters.status !== 'All') queryParams.append('status', filters.status);
    if (filters.paymentStatus && filters.paymentStatus !== 'All') queryParams.append('paymentStatus', filters.paymentStatus);
    if (filters.minAmount) queryParams.append('minAmount', filters.minAmount);
    if (filters.maxAmount) queryParams.append('maxAmount', filters.maxAmount);
    if (filters.sort) queryParams.append('sort', filters.sort);
    
    // Add custom date ranges
    if (filters.dateRange && filters.dateRange !== 'All') {
      const date = new Date();
      if (filters.dateRange === 'today') {
        date.setHours(0,0,0,0);
        queryParams.append('minDate', date.toISOString());
      } else if (filters.dateRange === 'yesterday') {
        const yest = new Date(date);
        yest.setDate(yest.getDate() - 1);
        yest.setHours(0,0,0,0);
        const yestEnd = new Date(date);
        yestEnd.setDate(yestEnd.getDate() - 1);
        yestEnd.setHours(23,59,59,999);
        queryParams.append('minDate', yest.toISOString());
        queryParams.append('maxDate', yestEnd.toISOString());
      } else if (filters.dateRange === 'last7') {
        date.setDate(date.getDate() - 7);
        queryParams.append('minDate', date.toISOString());
      } else if (filters.dateRange === 'last30') {
        date.setDate(date.getDate() - 30);
        queryParams.append('minDate', date.toISOString());
      } else if (filters.dateRange === 'thisMonth') {
        date.setDate(1);
        date.setHours(0,0,0,0);
        queryParams.append('minDate', date.toISOString());
      } else if (filters.dateRange === 'lastMonth') {
        const lastMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
        const lastMonthEnd = new Date(date.getFullYear(), date.getMonth(), 0);
        queryParams.append('minDate', lastMonth.toISOString());
        queryParams.append('maxDate', lastMonthEnd.toISOString());
      }
    }

    try {
      const response = await api.get(`/admin/orders?${queryParams.toString()}`, {
        signal: ordersAbortController.signal
      });
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
      if (axios.isCancel(error)) return;
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
