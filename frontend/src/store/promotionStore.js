import { create } from "zustand";
import promotionService from "../services/promotionService";
import axios from "axios";

let promotionsAbortController = null;

const usePromotionStore = create((set, get) => ({
  promotions: [],
  isLoading: false,
  // Per-promotion loading: Set of promotion IDs currently being updated/deleted
  updatingPromotionIds: new Set(),
  error: null,
  searchQuery: "",
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
      pagination: { ...state.pagination, itemsPerPage: limit, currentPage: 1 },
    }));
  },

  fetchPromotions: async (
    page = get().pagination.currentPage,
    overrideParams = {},
  ) => {
    if (promotionsAbortController) {
      promotionsAbortController.abort();
    }
    promotionsAbortController = new AbortController();

    set({ isLoading: true, error: null });
    const { searchQuery, pagination } = get();

    const effectiveSearch =
      overrideParams.search !== undefined ? overrideParams.search : searchQuery;
    const filters = overrideParams.filters || {};

    const limit = overrideParams.limit ?? pagination.itemsPerPage;

    try {
      const { data } = await promotionService.getPromotions(
        {
          page,
          limit,
          search: effectiveSearch,
          status: filters.status,
          type: filters.type,
          applyTo: filters.applyTo,
          sort: filters.sort,
        },
        {
          signal: promotionsAbortController.signal,
        },
      );
      set({
        promotions: data.promotions || data,
        pagination: data.pagination || get().pagination,
        isLoading: false,
      });
    } catch (error) {
      if (axios.isCancel(error)) return;
      set({
        error: error.response?.data?.message || "Failed to fetch promotions",
        isLoading: false,
      });
    }
  },

  createPromotion: async (promotionData) => {
    set({ isLoading: true, error: null });
    try {
      await promotionService.createPromotion(promotionData);
      set({ isLoading: false });
      // Refetch the current page so row count never exceeds the limit
      const { pagination, fetchPromotions } = get();
      fetchPromotions(pagination.currentPage);
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to create promotion",
        isLoading: false,
      });
      return false;
    }
  },

  updatePromotion: async (id, promotionData) => {
    const prevPromotions = get().promotions;

    // Optimistic patch
    set((state) => ({
      updatingPromotionIds: new Set([...state.updatingPromotionIds, id]),
      promotions: state.promotions.map((p) =>
        p.id === id ? { ...p, ...promotionData } : p,
      ),
      error: null,
    }));

    try {
      const { data } = await promotionService.updatePromotion(
        id,
        promotionData,
      );
      const updated = data?.promotion || data?.data || { ...promotionData, id };
      set((state) => {
        const next = new Set(state.updatingPromotionIds);
        next.delete(id);
        return {
          updatingPromotionIds: next,
          // Confirm with server response data
          promotions: state.promotions.map((p) =>
            p.id === id ? { ...p, ...updated } : p,
          ),
        };
      });
      return true;
    } catch (error) {
      // Rollback
      set((state) => {
        const next = new Set(state.updatingPromotionIds);
        next.delete(id);
        return {
          updatingPromotionIds: next,
          promotions: prevPromotions,
          error: error.response?.data?.message || "Failed to update promotion",
        };
      });
      return false;
    }
  },

  deletePromotion: async (id) => {
    const prevPromotions = get().promotions;

    // Optimistically remove
    set((state) => ({
      promotions: state.promotions.filter((p) => p.id !== id),
      updatingPromotionIds: new Set([...state.updatingPromotionIds, id]),
    }));

    try {
      await promotionService.deletePromotion(id);
      set((state) => {
        const next = new Set(state.updatingPromotionIds);
        next.delete(id);
        return { updatingPromotionIds: next };
      });
      // Refetch to fill the gap and keep pagination accurate
      const { pagination, fetchPromotions } = get();
      fetchPromotions(pagination.currentPage);
      return true;
    } catch (error) {
      // Rollback
      set((state) => {
        const next = new Set(state.updatingPromotionIds);
        next.delete(id);
        return {
          updatingPromotionIds: next,
          promotions: prevPromotions,
          error: error.response?.data?.message || "Failed to delete promotion",
        };
      });
      return false;
    }
  },
}));

export default usePromotionStore;
