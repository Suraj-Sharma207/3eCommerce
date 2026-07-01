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

  fetchCustomers: async (page = get().pagination.currentPage) => {
    if (customersAbortController) {
      customersAbortController.abort();
    }
    customersAbortController = new AbortController();

    set({ isLoading: true, error: null });
    const { searchQuery, pagination } = get();
    
    try {
      const { data } = await customerService.getCustomers({
        page,
        limit: pagination.itemsPerPage,
        search: searchQuery,
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
