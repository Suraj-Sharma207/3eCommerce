import { create } from 'zustand';
import productService from '../services/productService';

const useProductStore = create((set, get) => ({
  products: [],
  product: null,
  isLoading: false,
  // Per-product loading: Set of product IDs currently being updated/deleted
  updatingProductIds: new Set(),
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
      const { data } = await productService.createProduct(productData);
      // Append new product to the list without refetching
      const newProduct = data?.product || data?.data || data;
      set((state) => ({
        isLoading: false,
        products: newProduct ? [newProduct, ...state.products] : state.products,
        pagination: {
          ...state.pagination,
          totalItems: state.pagination.totalItems + 1,
        },
      }));
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
    const prevProducts = get().products;

    // Optimistically update the product
    set((state) => ({
      updatingProductIds: new Set([...state.updatingProductIds, id]),
      error: null,
      products: state.products.map((p) => (p.id === id ? { ...p, ...productData } : p)),
    }));

    try {
      const { data } = await productService.updateProduct(id, productData);
      const updatedProduct = data?.product || data?.data || { ...productData, id };
      
      // Patch with the final server-calculated product (e.g., dynamic finalPrice)
      set((state) => {
        const next = new Set(state.updatingProductIds);
        next.delete(id);
        return {
          updatingProductIds: next,
          products: state.products.map((p) => (p.id === id ? { ...p, ...updatedProduct } : p)),
        };
      });
      return true;
    } catch (error) {
      // Rollback
      set((state) => {
        const next = new Set(state.updatingProductIds);
        next.delete(id);
        return {
          updatingProductIds: next,
          products: prevProducts,
          error: error.response?.data?.message || 'Failed to update product',
        };
      });
      return false;
    }
  },

  deleteProduct: async (id) => {
    const prevProducts = get().products;

    // Optimistically remove the product from the list
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
      updatingProductIds: new Set([...state.updatingProductIds, id]),
      pagination: {
        ...state.pagination,
        totalItems: Math.max(0, state.pagination.totalItems - 1),
      },
    }));

    try {
      await productService.deleteProduct(id);
      set((state) => {
        const next = new Set(state.updatingProductIds);
        next.delete(id);
        return { updatingProductIds: next };
      });
      return true;
    } catch (error) {
      // Rollback
      set((state) => {
        const next = new Set(state.updatingProductIds);
        next.delete(id);
        return {
          updatingProductIds: next,
          products: prevProducts,
          pagination: {
            ...state.pagination,
            totalItems: prevProducts.length,
          },
          error: error.response?.data?.message || 'Failed to delete product',
        };
      });
      return false;
    }
  },
}));

export default useProductStore;
