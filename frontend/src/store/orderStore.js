import { create } from 'zustand';
import api from '../services/api';

const useOrderStore = create((set) => ({
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,

  checkout: async (checkoutData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/orders/checkout', checkoutData);
      set({ currentOrder: response.data.data, isLoading: false });
      return response.data.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Checkout failed', isLoading: false });
      return null;
    }
  },

  fetchUserOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/orders');
      set({ orders: response.data.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch orders', isLoading: false });
    }
  },

  fetchOrderById: async (orderId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/orders/${orderId}`);
      set({ currentOrder: response.data.data, isLoading: false });
      return response.data.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch order', isLoading: false });
      return null;
    }
  }
}));

export default useOrderStore;
