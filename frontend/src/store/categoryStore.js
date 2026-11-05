import { create } from "zustand";
import api from "../services/api";

const useCategoryStore = create((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,
  hasFetched: false,

  fetchCategories: async (force = false) => {
    // Prevent multiple fetches if already fetched and not forcing
    if (!force && get().hasFetched) return;

    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/products/categories");
      // API returns { data: { categories: [...] } }
      const categoriesData =
        response.data?.data?.categories ||
        response.data?.data ||
        response.data ||
        [];

      set({
        categories: Array.isArray(categoriesData) ? categoriesData : [],
        isLoading: false,
        hasFetched: true,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch categories",
        isLoading: false,
      });
    }
  },
}));

export default useCategoryStore;
