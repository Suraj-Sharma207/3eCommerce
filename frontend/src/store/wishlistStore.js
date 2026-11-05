import { create } from "zustand";
import api from "../services/api";

let fetchWishlistPromise = null;

const useWishlistStore = create((set, get) => ({
  wishlist: null,
  isLoading: false,
  hasFetched: false,
  error: null,

  fetchWishlist: async () => {
    if (fetchWishlistPromise) return fetchWishlistPromise;

    const { hasFetched } = get();
    if (!hasFetched) {
      set({ isLoading: true, error: null });
    }

    fetchWishlistPromise = (async () => {
      try {
        const response = await api.get("/wishlist");
        set({
          wishlist: response.data.data,
          isLoading: false,
          hasFetched: true,
        });
      } catch (error) {
        set({
          error: error.response?.data?.message || "Failed to fetch wishlist",
          isLoading: false,
          hasFetched: true,
        });
      } finally {
        fetchWishlistPromise = null;
      }
    })();
    return fetchWishlistPromise;
  },

  // UI State for Drawer
  isWishlistOpen: false,
  openWishlist: () => set({ isWishlistOpen: true }),
  closeWishlist: () => set({ isWishlistOpen: false }),
  toggleWishlistDrawer: () =>
    set((state) => ({ isWishlistOpen: !state.isWishlistOpen })),

  // Request Locks
  pendingProducts: {},

  toggleWishlist: async (productId) => {
    const state = get();
    // 1. Lock Per Product: Ignore duplicate clicks while syncing
    if (state.pendingProducts[productId]) return;

    // Lock this product
    set((s) => ({
      pendingProducts: { ...s.pendingProducts, [productId]: true },
    }));

    const { wishlist } = get();
    // Save previous state for rollback
    const previousWishlist = wishlist
      ? JSON.parse(JSON.stringify(wishlist))
      : null;

    // Optimistically update UI
    const isCurrentlyInWishlist = wishlist?.items?.some(
      (item) => item.productId === productId,
    );
    let newWishlist;

    if (isCurrentlyInWishlist) {
      newWishlist = {
        ...wishlist,
        items: wishlist.items.filter((item) => item.productId !== productId),
      };
    } else {
      newWishlist = {
        ...(wishlist || { items: [] }),
        items: [
          ...(wishlist?.items || []),
          { productId, isOptimistic: true, product: { id: productId } },
        ],
      };
    }

    // Apply immediately
    set({ wishlist: newWishlist, error: null });

    try {
      const response = await api.post("/wishlist/toggle", { productId });

      // Update with the actual verified data from the server, and release lock
      set((s) => ({
        wishlist: response.data.data,
        pendingProducts: { ...s.pendingProducts, [productId]: false },
      }));
      return true;
    } catch (error) {
      // Rollback on failure and release lock
      set((s) => ({
        wishlist: previousWishlist,
        error: error.response?.data?.message || "Failed to update wishlist",
        pendingProducts: { ...s.pendingProducts, [productId]: false },
      }));
      throw error;
    }
  },

  isInWishlist: (productId) => {
    const { wishlist } = get();
    if (!wishlist || !wishlist.items) return false;
    return wishlist.items.some((item) => item.productId === productId);
  },

  clearWishlist: () => set({ wishlist: null, hasFetched: false, error: null }),
}));
export default useWishlistStore;
