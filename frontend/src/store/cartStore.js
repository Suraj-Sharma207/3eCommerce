import { create } from "zustand";
import api from "../services/api";
import toast from "react-hot-toast";

const abortControllers = {};
const updateTimeouts = {};
const previousQuantities = {};
let fetchCartPromise = null;

const useCartStore = create((set, get) => ({
  cart: null,
  isLoading: false,
  loadingProducts: {}, // For addToCart: keyed by productId
  updatingItemIds: new Set(), // For updateQuantity / removeFromCart: per-item loading
  error: null,

  fetchCart: async () => {
    if (fetchCartPromise) return fetchCartPromise;
    set({ isLoading: true, error: null });

    fetchCartPromise = (async () => {
      try {
        const response = await api.get("/cart");
        set({ cart: response.data.data, isLoading: false });
      } catch (error) {
        set({
          error: error.response?.data?.message || "Failed to fetch cart",
          isLoading: false,
        });
      } finally {
        fetchCartPromise = null;
      }
    })();
    return fetchCartPromise;
  },

  addToCart: async (productId, quantity = 1, productOrName = null) => {
    const currentState = get();
    const prevCart = currentState.cart;

    // Determine product details
    let productObj = null;
    let productName = "Item";

    if (productOrName && typeof productOrName === "object") {
      productObj = productOrName;
      productName = productOrName.name || "Item";
    } else if (typeof productOrName === "string") {
      productName = productOrName;
    }

    // Check if item is already in cart
    const existingItem = prevCart?.items?.find(
      (item) => item.product?.id === productId || item.productId === productId
    );

    // Client-side stock check if available
    const availableStock = productObj?.stock ?? existingItem?.product?.stock;
    if (availableStock !== undefined && availableStock !== null) {
      const currentQty = existingItem ? existingItem.quantity : 0;
      if (currentQty + quantity > availableStock) {
        toast.error(`Cannot add more than available stock (${availableStock}).`, {
          id: `cart-stock-${productId}`,
          duration: 3000,
        });
        return false;
      }
    }

    // Build optimistic cart items
    let newItems;
    if (existingItem) {
      newItems = prevCart.items.map((item) =>
        item.product?.id === productId || item.productId === productId
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      const fallbackProduct = productObj || {
        id: productId,
        name: productName,
        price: 0,
        finalPrice: 0,
        images: [],
      };
      const optimisticItem = {
        id: `temp-${Date.now()}-${productId}`,
        productId,
        quantity,
        price: fallbackProduct.finalPrice || fallbackProduct.price || 0,
        product: fallbackProduct,
      };
      newItems = [...(prevCart?.items || []), optimisticItem];
    }

    const newSubtotal = newItems.reduce((sum, item) => {
      const price = item.product?.finalPrice || item.product?.price || item.price || 0;
      return sum + price * item.quantity;
    }, 0);

    const optimisticCart = prevCart
      ? {
          ...prevCart,
          items: newItems,
          subtotal: newSubtotal,
          totalAmount: newSubtotal,
        }
      : {
          id: "temp-cart",
          items: newItems,
          subtotal: newSubtotal,
          totalAmount: newSubtotal,
        };

    // 1. Instant UI update (0ms latency)
    set({
      cart: optimisticCart,
      error: null,
    });

    toast.success(`🛒  Added to Cart — ${productName}.`, {
      id: `cart-add-${productId}`,
      duration: 2500,
    });

    // 2. Background API call
    try {
      const response = await api.post("/cart/items", { productId, quantity });
      // Reconcile with server state
      set({ cart: response.data.data });
      return true;
    } catch (error) {
      // 3. Rollback on failure
      set({
        cart: prevCart,
        error: error.response?.data?.message || "Failed to add item",
      });
      toast.error(
        error.response?.data?.message || "Unable to add item to cart. Reverted.",
        {
          id: `cart-error-${productId}`,
          duration: 3500,
        }
      );
      return false;
    }
  },

  updateQuantity: async (productId, quantity) => {
    const currentState = get();
    if (!currentState.cart) return;

    const itemToUpdate = currentState.cart.items.find(
      (item) => item.product?.id === productId || item.productId === productId,
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
            : item,
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
        const response = await api.put(
          `/cart/items/${productId}`,
          { quantity },
          {
            signal: controller.signal,
          },
        );

        // Sync with server state
        set({ cart: response.data.data });
        delete previousQuantities[productId];
      } catch (error) {
        // Ignore aborted requests
        if (error.name === "CanceledError" || error.message === "canceled") {
          return;
        }

        // Rollback to the previous quantity
        const revertQuantity = previousQuantities[productId];
        set((state) => ({
          cart: state.cart
            ? {
                ...state.cart,
                items: state.cart.items.map((item) =>
                  item.product?.id === productId || item.productId === productId
                    ? { ...item, quantity: revertQuantity }
                    : item,
                ),
              }
            : state.cart,
          error: error.response?.data?.message || "Failed to update quantity",
        }));
        delete previousQuantities[productId];
        toast.error("Failed to update quantity. Reverted to previous value.");
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
              (item) =>
                item.product?.id !== productId && item.productId !== productId,
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
          error: error.response?.data?.message || "Failed to remove item",
        };
      });
      toast.error("Failed to remove item from cart.");
    }
  },

  clearCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.delete("/cart");
      set({ cart: response.data.data, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to clear cart",
        isLoading: false,
      });
    }
  },

  resetCart: () => {
    set({ cart: null, error: null });
  },
}));

export default useCartStore;
