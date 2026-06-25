import { create } from 'zustand';
import customerService from '../services/customerService';

const useCustomerStore = create((set, get) => ({
  customers: [],
  selectedCustomer: null,
  isLoading: false,
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

  fetchCustomers: async (page = get().pagination.currentPage) => {
    set({ isLoading: true, error: null });
    const { searchQuery } = get();
    
    try {
      const { data } = await customerService.getCustomers({
        page,
        limit: 10,
        search: searchQuery,
      });
      
      set({
        customers: data.customers,
        pagination: data.pagination,
        isLoading: false,
      });
    } catch (error) {
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
    set({ isLoading: true, error: null });
    try {
      await customerService.updateCustomerStatus(id, active);
      
      // Update local state optimistic UI
      set((state) => ({
        customers: state.customers.map(c => c.id === id ? { ...c, active } : c),
        selectedCustomer: state.selectedCustomer?.id === id 
          ? { ...state.selectedCustomer, active } 
          : state.selectedCustomer,
        isLoading: false
      }));
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to update customer status', 
        isLoading: false 
      });
      return false;
    }
  },
}));

export default useCustomerStore;
