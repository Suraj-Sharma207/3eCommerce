import { create } from 'zustand';
import api from '../services/api';
import toast from 'react-hot-toast';

const abortControllers = {};
const updateTimeouts = {};
const previousQuantities = {};

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
        duration: 2500
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
        duration: 3000
      });
      return false;
    }
  },

  updateQuantity: async (productId, quantity) => {
    const currentState = get();
    if (!currentState.cart) return;

    const itemToUpdate = currentState.cart.items.find(
      (item) => item.product?.id === productId || item.productId === productId
    );
    if (!itemToUpdate) return;

    // Record the original quantity before the first optimistic update in this burst
    if (!(productId in previousQuantities)) {
      previousQuantities[productId] = itemToUpdate.quantity;
    }

    // Optimistic update locally
    set((state) => ({
      cart: {
        ...state.cart,
        items: state.cart.items.map((item) =>
          item.product?.id === productId || item.productId === productId
            ? { ...item, quantity }
            : item
        ),
      },
      error: null,
    }));

    // Clear existing timeout for this product
    if (updateTimeouts[productId]) {
      clearTimeout(updateTimeouts[productId]);
    }

    // Debounce the API call
    updateTimeouts[productId] = setTimeout(async () => {
      // Abort any in-flight request for this product
      if (abortControllers[productId]) {
        abortControllers[productId].abort();
      }
      const controller = new AbortController();
      abortControllers[productId] = controller;

      try {
        const response = await api.put(`/cart/items/${productId}`, { quantity }, {
          signal: controller.signal
        });
        
        // Sync with server state
        set({ cart: response.data.data });
        delete previousQuantities[productId];
      } catch (error) {
        // Ignore aborted requests
        if (error.name === 'CanceledError' || error.message === 'canceled') {
          return;
        }

        // Rollback to the previous quantity
        const revertQuantity = previousQuantities[productId];
        set((state) => ({
          cart: state.cart
            ? {
                ...state.cart,
                items: state.cart.items.map((item) =>
                  (item.product?.id === productId || item.productId === productId)
                    ? { ...item, quantity: revertQuantity }
                    : item
                ),
              }
            : state.cart,
          error: error.response?.data?.message || 'Failed to update quantity',
        }));
        delete previousQuantities[productId];
        toast.error('Failed to update quantity. Reverted to previous value.');
      } finally {
        if (abortControllers[productId] === controller) {
          delete abortControllers[productId];
        }
        delete updateTimeouts[productId];
      }
    }, 300); // 300ms debounce
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
