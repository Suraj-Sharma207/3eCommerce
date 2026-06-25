import { create } from 'zustand';
import api from '../services/api';

const useWishlistStore = create((set, get) => ({
  wishlist: null,
  isLoading: false,
  hasFetched: false,
  error: null,

  fetchWishlist: async () => {
    const { hasFetched } = get();
    if (!hasFetched) {
      set({ isLoading: true, error: null });
    }
    
    try {
      const response = await api.get('/wishlist');
      set({ wishlist: response.data.data, isLoading: false, hasFetched: true });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch wishlist', isLoading: false, hasFetched: true });
    }
  },

  toggleWishlist: async (productId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/wishlist/toggle', { productId });
      set({ wishlist: response.data.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to update wishlist', isLoading: false });
    }
  },

  isInWishlist: (productId) => {
    const { wishlist } = get();
    if (!wishlist || !wishlist.items) return false;
    return wishlist.items.some(item => item.productId === productId);
  }
}));

export default useWishlistStore;
