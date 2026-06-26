import { create } from 'zustand';
import api from '../services/api';
import toast from 'react-hot-toast';

const useCartStore = create((set, get) => ({
  cart: null,
  isLoading: false,
  loadingProducts: {},     // For addToCart: keyed by productId
  updatingItemIds: new Set(), // For updateQuantity / removeFromCart: per-item loading
  error: null,

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/cart');
      set({ cart: response.data.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch cart', isLoading: false });
    }
  },

  addToCart: async (productId, quantity = 1, productName = null) => {
    set((state) => ({
      loadingProducts: { ...state.loadingProducts, [productId]: true },
      error: null
    }));
    try {
      const response = await api.post('/cart/items', { productId, quantity });
      set((state) => {
        const nextLoading = { ...state.loadingProducts };
        delete nextLoading[productId];
        return { cart: response.data.data, loadingProducts: nextLoading };
      });
      const name = productName || 'Item';
      toast.success(`🛒  Added to Cart — ${name}.`, {
        id: `cart-add-${productId}`,
        duration: 2500,
        style: {
          background: '#111827',
          color: '#fff',
          borderRadius: '12px',
          padding: '12px 20px',
          fontSize: '14px',
          maxWidth: '340px',
        }
      });
      return true;
    } catch (error) {
      set((state) => {
        const nextLoading = { ...state.loadingProducts };
        delete nextLoading[productId];
        return { error: error.response?.data?.message || 'Failed to add item', loadingProducts: nextLoading };
      });
      toast.error('Unable to add item to cart. Please try again.', {
        id: `cart-error-${productId}`,
        duration: 3000,
        style: {
          background: '#7f1d1d',
          color: '#fff',
          borderRadius: '12px',
          padding: '12px 20px',
          fontSize: '14px',
          maxWidth: '340px',
        }
      });
      return false;
    }
  },

  updateQuantity: async (productId, quantity) => {
    const prevCart = get().cart;

    // Optimistic update — update quantity locally, no global spinner
    set((state) => ({
      updatingItemIds: new Set([...state.updatingItemIds, productId]),
      cart: state.cart
        ? {
            ...state.cart,
            items: state.cart.items.map((item) =>
              item.product?.id === productId || item.productId === productId
                ? { ...item, quantity }
                : item
            ),
          }
        : state.cart,
      error: null,
    }));

    try {
      const response = await api.put(`/cart/items/${productId}`, { quantity });
      set((state) => {
        const next = new Set(state.updatingItemIds);
        next.delete(productId);
        return { cart: response.data.data, updatingItemIds: next };
      });
    } catch (error) {
      // Rollback
      set((state) => {
        const next = new Set(state.updatingItemIds);
        next.delete(productId);
        return {
          updatingItemIds: next,
          cart: prevCart,
          error: error.response?.data?.message || 'Failed to update quantity',
        };
      });
      toast.error('Failed to update quantity.');
    }
  },

  removeFromCart: async (productId) => {
    const prevCart = get().cart;

    // Optimistic removal — remove item immediately
    set((state) => ({
      updatingItemIds: new Set([...state.updatingItemIds, productId]),
      cart: state.cart
        ? {
            ...state.cart,
            items: state.cart.items.filter(
              (item) => item.product?.id !== productId && item.productId !== productId
            ),
          }
        : state.cart,
      error: null,
    }));

    try {
      const response = await api.delete(`/cart/items/${productId}`);
      set((state) => {
        const next = new Set(state.updatingItemIds);
        next.delete(productId);
        return { cart: response.data.data, updatingItemIds: next };
      });
    } catch (error) {
      // Rollback
      set((state) => {
        const next = new Set(state.updatingItemIds);
        next.delete(productId);
        return {
          updatingItemIds: next,
          cart: prevCart,
          error: error.response?.data?.message || 'Failed to remove item',
        };
      });
      toast.error('Failed to remove item from cart.');
    }
  },

  clearCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.delete('/cart');
      set({ cart: response.data.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to clear cart', isLoading: false });
    }
  },

  resetCart: () => {
    set({ cart: null, error: null });
  }
}));

export default useCartStore;
