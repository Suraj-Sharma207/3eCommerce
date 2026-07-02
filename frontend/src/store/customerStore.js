import { create } from 'zustand';
import customerService from '../services/customerService';
import axios from 'axios';

let customersAbortController = null;

const useCustomerStore = create((set, get) => ({
  customers: [],
  selectedCustomer: null,
  isLoading: false,
  // Per-customer loading: Set of customer IDs currently being updated
  updatingCustomerIds: new Set(),
  error: null,
  searchQuery: '',
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setItemsPerPage: (limit) => {
    set((state) => ({
      pagination: { ...state.pagination, itemsPerPage: limit, currentPage: 1 }
    }));
  },

  fetchCustomers: async (page = get().pagination.currentPage, overrideParams = {}) => {
    if (customersAbortController) {
      customersAbortController.abort();
    }
    customersAbortController = new AbortController();

    set({ isLoading: true, error: null });
    const { searchQuery, pagination } = get();
    
    const effectiveSearch = overrideParams.search !== undefined ? overrideParams.search : searchQuery;
    const filters = overrideParams.filters || {};
    
    // Add custom date ranges
    let minDate, maxDate;
    if (filters.dateRange && filters.dateRange !== 'All') {
      const date = new Date();
      if (filters.dateRange === 'today') {
        date.setHours(0,0,0,0);
        minDate = date.toISOString();
      } else if (filters.dateRange === 'yesterday') {
        const yest = new Date(date);
        yest.setDate(yest.getDate() - 1);
        yest.setHours(0,0,0,0);
        const yestEnd = new Date(date);
        yestEnd.setDate(yestEnd.getDate() - 1);
        yestEnd.setHours(23,59,59,999);
        minDate = yest.toISOString();
        maxDate = yestEnd.toISOString();
      } else if (filters.dateRange === 'last7') {
        date.setDate(date.getDate() - 7);
        minDate = date.toISOString();
      } else if (filters.dateRange === 'last30') {
        date.setDate(date.getDate() - 30);
        minDate = date.toISOString();
      } else if (filters.dateRange === 'thisMonth') {
        date.setDate(1);
        date.setHours(0,0,0,0);
        minDate = date.toISOString();
      } else if (filters.dateRange === 'lastMonth') {
        const lastMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
        const lastMonthEnd = new Date(date.getFullYear(), date.getMonth(), 0);
        minDate = lastMonth.toISOString();
        maxDate = lastMonthEnd.toISOString();
      }
    }

    try {
      const { data } = await customerService.getCustomers({
        page,
        limit: pagination.itemsPerPage,
        search: effectiveSearch,
        status: filters.status && filters.status !== 'All' ? filters.status : undefined,
        minDate,
        maxDate,
        sort: filters.sort
      }, {
        signal: customersAbortController.signal
      });
      
      set({
        customers: data.customers,
        pagination: data.pagination,
        isLoading: false,
      });
    } catch (error) {
      if (axios.isCancel(error)) return;
      set({ 
        error: error.response?.data?.message || 'Failed to fetch customers', 
        isLoading: false 
      });
    }
  },

  fetchCustomerDetails: async (id) => {
    set({ isLoading: true, error: null, selectedCustomer: null });
    try {
      const { data } = await customerService.getCustomerById(id);
      set({ selectedCustomer: data, isLoading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch customer details', 
        isLoading: false 
      });
    }
  },

  updateCustomerStatus: async (id, active) => {
    const prevCustomers = get().customers;
    const prevSelected = get().selectedCustomer;

    // Optimistic update — patch only the matching customer row, no global loading
    set((state) => ({
      updatingCustomerIds: new Set([...state.updatingCustomerIds, id]),
      customers: state.customers.map((c) => (c.id === id ? { ...c, active } : c)),
      selectedCustomer:
        state.selectedCustomer?.id === id
          ? { ...state.selectedCustomer, active }
          : state.selectedCustomer,
      error: null,
    }));

    try {
      await customerService.updateCustomerStatus(id, active);
      // Success — clear loading indicator for this customer
      set((state) => {
        const next = new Set(state.updatingCustomerIds);
        next.delete(id);
        return { updatingCustomerIds: next };
      });
      return true;
    } catch (error) {
      // Rollback
      set((state) => {
        const next = new Set(state.updatingCustomerIds);
        next.delete(id);
        return {
          updatingCustomerIds: next,
          customers: prevCustomers,
          selectedCustomer: prevSelected,
          error: error.response?.data?.message || 'Failed to update customer status',
        };
      });
      return false;
    }
  },
}));

export default useCustomerStore;
