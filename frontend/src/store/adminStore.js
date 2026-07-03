import { create } from 'zustand';
import api from '../services/api';
import toast from 'react-hot-toast';
import axios from 'axios';

let ordersAbortController = null;

const useAdminStore = create((set, get) => ({
  analytics: {}, // Initialized to empty object to allow immediate shell render
  dashboardLoading: {
    kpis: false,
    recentOrders: false,
    topProducts: false,
    orderStatuses: false,
    extendedStats: false,
  },
  inventoryAlerts: null,
  inventoryAlertsError: null,
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
  ordersCache: {},
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
    // Fire all granular fetchers concurrently so widgets load independently
    Promise.allSettled([
      get().fetchDashboardKpis(force),
      get().fetchDashboardRecentOrders(force),
      get().fetchDashboardTopProducts(force),
      get().fetchDashboardOrderStatuses(force),
      get().fetchDashboardExtendedStats(force),
      get().fetchRevenueChartData('7d') // Fetch default revenue chart
    ]);
  },

  fetchDashboardKpis: async (force) => {
    const state = get();
    if (!force && state.analytics.kpis) return;
    set(state => ({ dashboardLoading: { ...state.dashboardLoading, kpis: true } }));
    try {
      const response = await api.get('/admin/dashboard/kpis');
      set(state => ({
        analytics: { ...state.analytics, kpis: response.data?.data || response.data },
        dashboardLoading: { ...state.dashboardLoading, kpis: false }
      }));
    } catch (error) {
      set(state => ({ dashboardLoading: { ...state.dashboardLoading, kpis: false } }));
    }
  },

  fetchDashboardRecentOrders: async (force) => {
    const state = get();
    if (!force && state.analytics.recentOrders) return;
    set(state => ({ dashboardLoading: { ...state.dashboardLoading, recentOrders: true } }));
    try {
      const response = await api.get('/admin/dashboard/recent-orders');
      set(state => ({
        analytics: { ...state.analytics, recentOrders: response.data?.data || response.data },
        dashboardLoading: { ...state.dashboardLoading, recentOrders: false }
      }));
    } catch (error) {
      set(state => ({ dashboardLoading: { ...state.dashboardLoading, recentOrders: false } }));
    }
  },

  fetchDashboardTopProducts: async (force) => {
    const state = get();
    if (!force && state.analytics.topProducts) return;
    set(state => ({ dashboardLoading: { ...state.dashboardLoading, topProducts: true } }));
    try {
      const response = await api.get('/admin/dashboard/top-products');
      set(state => ({
        analytics: { ...state.analytics, topProducts: response.data?.data || response.data },
        dashboardLoading: { ...state.dashboardLoading, topProducts: false }
      }));
    } catch (error) {
      set(state => ({ dashboardLoading: { ...state.dashboardLoading, topProducts: false } }));
    }
  },

  fetchDashboardOrderStatuses: async (force) => {
    const state = get();
    if (!force && state.analytics.statusDistribution) return;
    set(state => ({ dashboardLoading: { ...state.dashboardLoading, orderStatuses: true } }));
    try {
      const response = await api.get('/admin/dashboard/order-statuses');
      set(state => ({
        analytics: { ...state.analytics, statusDistribution: response.data?.data || response.data },
        dashboardLoading: { ...state.dashboardLoading, orderStatuses: false }
      }));
    } catch (error) {
      set(state => ({ dashboardLoading: { ...state.dashboardLoading, orderStatuses: false } }));
    }
  },

  fetchDashboardExtendedStats: async (force) => {
    const state = get();
    if (!force && state.analytics.mostViewed) return;
    set(state => ({ dashboardLoading: { ...state.dashboardLoading, extendedStats: true } }));
    try {
      const response = await api.get('/admin/dashboard/extended-stats');
      const extendedStats = response.data?.data || response.data;
      set(state => ({
        analytics: { ...state.analytics, ...extendedStats },
        dashboardLoading: { ...state.dashboardLoading, extendedStats: false }
      }));
    } catch (error) {
      set(state => ({ dashboardLoading: { ...state.dashboardLoading, extendedStats: false } }));
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
    const limit = overrideParams.limit ?? ordersPagination.itemsPerPage;
    
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

    const cacheKey = queryParams.toString();
    const { ordersCache } = get();

    if (ordersCache[cacheKey]) {
      set({
        orders: ordersCache[cacheKey].orders,
        ordersPagination: ordersCache[cacheKey].pagination,
        isLoading: false
      });
      return;
    }

    try {
      const response = await api.get(`/admin/orders?${cacheKey}`, {
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

      // Populate cache
      const updatedCache = { ...get().ordersCache };
      updatedCache[cacheKey] = {
        orders: response.data.data.orders,
        pagination: response.data.data.pagination || get().ordersPagination
      };
      set({ ordersCache: updatedCache });

    } catch (error) {
      if (axios.isCancel(error)) return;
      set({ error: error.response?.data?.message || 'Failed to fetch admin orders', isLoading: false });
    }
  },

  prefetchOrders: async (page, overrideParams = {}) => {
    const { searchQuery, ordersPagination, ordersCache } = get();
    const limit = overrideParams.limit ?? ordersPagination.itemsPerPage;
    const effectiveSearch = overrideParams.search !== undefined ? overrideParams.search : searchQuery;
    const filters = overrideParams.filters || {};
    
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    if (effectiveSearch) queryParams.append('search', effectiveSearch);
    if (filters.status && filters.status !== 'All') queryParams.append('status', filters.status);
    if (filters.paymentStatus && filters.paymentStatus !== 'All') queryParams.append('paymentStatus', filters.paymentStatus);
    if (filters.minAmount) queryParams.append('minAmount', filters.minAmount);
    if (filters.maxAmount) queryParams.append('maxAmount', filters.maxAmount);
    if (filters.sort) queryParams.append('sort', filters.sort);
    
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

    const cacheKey = queryParams.toString();
    
    // Prevent duplicate fetch if already cached
    if (ordersCache[cacheKey]) return;

    try {
      const response = await api.get(`/admin/orders?${cacheKey}`);
      const updatedCache = { ...get().ordersCache };
      updatedCache[cacheKey] = {
        orders: response.data.data.orders,
        pagination: response.data.data.pagination
      };
      set({ ordersCache: updatedCache });
    } catch (error) {
      // Silently fail predictive prefetching
      console.warn('Failed to prefetch orders:', error);
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
