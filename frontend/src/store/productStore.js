import { create } from 'zustand';
import productService from '../services/productService';

const useProductStore = create((set, get) => ({
  products: [],
  product: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  filters: {
    category: 'All',
    brand: 'All',
    minRating: '',
    minPrice: '',
    maxPrice: '',
    inStock: false,
    sale: false,
    sort: 'newest'
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12,
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setFilters: (newFilters) => {
    set((state) => ({ 
      filters: { ...state.filters, ...newFilters },
      // Reset to page 1 when filters change
      pagination: { ...state.pagination, currentPage: 1 } 
    }));
  },

  clearFilters: () => {
    set((state) => ({
      searchQuery: '',
      filters: {
        category: 'All',
        brand: 'All',
        minRating: '',
        minPrice: '',
        maxPrice: '',
        inStock: false,
        sale: false,
        sort: 'newest'
      },
      pagination: { ...state.pagination, currentPage: 1 }
    }));
    get().fetchProducts(1);
  },

  fetchProducts: async (page = get().pagination.currentPage) => {
    set({ isLoading: true, error: null });
    const { searchQuery, filters } = get();
    
    try {
      const { data } = await productService.getProducts({
        page,
        limit: 12,
        search: searchQuery,
        ...filters
      });
      
      set({
        products: data.products,
        pagination: data.pagination,
        isLoading: false,
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch products', 
        isLoading: false 
      });
    }
  },

  fetchProductById: async (id) => {
    set({ isLoading: true, error: null, product: null });
    try {
      const { data } = await productService.getProductById(id);
      set({ product: data.product, isLoading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch product details', 
        isLoading: false 
      });
    }
  },

  createProduct: async (productData) => {
    set({ isLoading: true, error: null });
    try {
      await productService.createProduct(productData);
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to create product', 
        isLoading: false 
      });
      return false;
    }
  },

  updateProduct: async (id, productData) => {
    set({ isLoading: true, error: null });
    try {
      await productService.updateProduct(id, productData);
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to update product', 
        isLoading: false 
      });
      return false;
    }
  },

  deleteProduct: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await productService.deleteProduct(id);
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to delete product', 
        isLoading: false 
      });
      return false;
    }
  },
}));

export default useProductStore;
