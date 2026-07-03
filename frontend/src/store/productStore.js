import { create } from 'zustand';
import productService from '../services/productService';
import axios from 'axios';

let productsAbortController = null;
let adminProductsAbortController = null;

const useProductStore = create((set, get) => ({
  products: [],
  product: null,
  isLoading: false,
  // Per-product loading: Set of product IDs currently being updated/deleted
  updatingProductIds: new Set(),
  error: null,
  searchQuery: '',
  homeProducts: {
    featured: [],
    trending: [],
    newArrivals: [],
    bestSellers: [],
    sale: []
  },
  hasFetchedHome: false,
  recommendedProducts: [],
  hasFetchedRecommended: false,
  filters: {
    category: 'All',
    brand: 'All',
    minRating: '',
    minPrice: '',
    maxPrice: '',
    inStock: false,
    sale: false,
    sort: 'newest',
    inventoryTab: 'all'
  },
  inventoryCounts: { all: 0, active: 0, outOfStock: 0 },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  },

  // ── Bulk Selection State ───────────────────────────────────────────────────
  // Store only IDs (Set<string>) for O(1) lookups — never store full objects
  selectedProductIds: new Set(),
  isBulkDeleting: false,

  fetchHomeProducts: async () => {
    if (get().hasFetchedHome) return;
    try {
      const response = await productService.getProductsHome();
      const data = response?.data || {};
      set({ 
        homeProducts: {
          featured: data.featuredCollection || data.featured || [],
          trending: data.trending || [],
          newArrivals: data.newArrivals || [],
          bestSellers: data.bestSellers || [],
          sale: data.specialOffers || data.sale || []
        },
        hasFetchedHome: true
      });
    } catch (error) {
      console.error('Failed to fetch home products:', error);
    }
  },

  fetchRecommendedProducts: async () => {
    if (get().hasFetchedRecommended) return;
    try {
      const response = await productService.getRecommendedProducts();
      const data = response?.data || response || {};
      set({ 
        recommendedProducts: data?.products || [],
        hasFetchedRecommended: true
      });
    } catch (error) {
      console.error('Failed to fetch recommended products:', error);
    }
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  // itemsPerPage is now driven by URL ?limit param — kept for backward compat
  setItemsPerPage: (limit) => {
    set((state) => ({
      pagination: { ...state.pagination, itemsPerPage: limit, currentPage: 1 }
    }));
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
        sort: 'newest',
        inventoryTab: state.filters.inventoryTab // Preserve the tab during generic clear
      },
      pagination: { ...state.pagination, currentPage: 1 }
    }));
    get().fetchProducts(1);
  },

  fetchProducts: async (page = get().pagination.currentPage) => {
    if (productsAbortController) {
      productsAbortController.abort();
    }
    productsAbortController = new AbortController();

    set({ isLoading: true, error: null });
    const { searchQuery, filters, pagination } = get();
    
    try {
      // Map frontend 'inventoryTab' to backend 'stockStatus'
      let stockStatus;
      if (filters.inventoryTab === 'active') stockStatus = 'active';
      else if (filters.inventoryTab === 'outOfStock') stockStatus = 'outOfStock';

      const { data } = await productService.getProducts({
        page,
        limit: pagination.itemsPerPage,
        search: searchQuery,
        stockStatus,
        ...filters,
        includeInventoryCounts: false
      }, {
        signal: productsAbortController.signal
      });
      
      set({
        products: data.products,
        pagination: data.pagination,
        inventoryCounts: data.pagination?.inventoryCounts || get().inventoryCounts,
        isLoading: false,
      });
    } catch (error) {
      if (axios.isCancel(error)) return;
      set({ 
        error: error.response?.data?.message || 'Failed to fetch products', 
        isLoading: false 
      });
    }
  },

  fetchAdminProducts: async (page = get().pagination.currentPage, overrideParams = {}) => {
    if (adminProductsAbortController) {
      adminProductsAbortController.abort();
    }
    adminProductsAbortController = new AbortController();

    set({ isLoading: true, error: null });
    const { searchQuery, filters, pagination } = get();

    // Prefer limit from override (URL-driven), fall back to store state
    const limit = overrideParams.limit ?? pagination.itemsPerPage;
    
    try {
      // Combine store filters with overrides
      const effectiveFilters = { ...filters, ...(overrideParams.filters || {}) };
      const effectiveSearch = overrideParams.search !== undefined ? overrideParams.search : searchQuery;
      
      let stockStatus;
      if (effectiveFilters.inventoryTab === 'active') stockStatus = 'active';
      else if (effectiveFilters.inventoryTab === 'outOfStock') stockStatus = 'outOfStock';

      const { data } = await productService.getAdminProducts({
        page,
        limit,
        search: effectiveSearch,
        stockStatus,
        ...effectiveFilters,
        includeInventoryCounts: true
      }, {
        signal: adminProductsAbortController.signal
      });
      
      set({
        // Always replace — never append
        products: data.products,
        pagination: data.pagination,
        inventoryCounts: data.pagination?.inventoryCounts || get().inventoryCounts,
        isLoading: false,
      });
    } catch (error) {
      if (axios.isCancel(error)) return;
      set({ 
        error: error.response?.data?.message || 'Failed to fetch admin products', 
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
      // Refetch the current page so row count never exceeds the limit
      const { pagination, fetchAdminProducts } = get();
      fetchAdminProducts(pagination.currentPage);
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
        
        // Check if stock changed from > 0 to 0 or vice versa
        const oldProduct = state.products.find(p => p.id === id);
        let productsList = state.products.map((p) => (p.id === id ? { ...p, ...updatedProduct } : p));
        let activeDelta = 0;
        let outOfStockDelta = 0;
        
        if (oldProduct) {
          const oldStock = oldProduct.stock;
          const newStock = updatedProduct.stock;
          
          if (oldStock > 0 && newStock === 0) {
             activeDelta = -1; outOfStockDelta = 1;
             if (state.filters.inventoryTab === 'active') productsList = productsList.filter(p => p.id !== id);
          } else if (oldStock === 0 && newStock > 0) {
             activeDelta = 1; outOfStockDelta = -1;
             if (state.filters.inventoryTab === 'outOfStock') productsList = productsList.filter(p => p.id !== id);
          }
        }

        return {
          updatingProductIds: next,
          products: productsList,
          inventoryCounts: {
            ...state.inventoryCounts,
            active: state.inventoryCounts.active + activeDelta,
            outOfStock: state.inventoryCounts.outOfStock + outOfStockDelta
          }
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
    const prevInventoryCounts = get().inventoryCounts;
    const deletedProduct = prevProducts.find(p => p.id === id);

    // Optimistically remove from local view and mark as updating
    set((state) => {
      const wasActive = deletedProduct?.stock > 0;
      const wasOutOfStock = deletedProduct?.stock === 0;
      return {
        products: state.products.filter((p) => p.id !== id),
        updatingProductIds: new Set([...state.updatingProductIds, id]),
        inventoryCounts: {
          all: Math.max(0, state.inventoryCounts.all - 1),
          active: wasActive ? Math.max(0, state.inventoryCounts.active - 1) : state.inventoryCounts.active,
          outOfStock: wasOutOfStock ? Math.max(0, state.inventoryCounts.outOfStock - 1) : state.inventoryCounts.outOfStock
        }
      };
    });

    try {
      await productService.deleteProduct(id);
      set((state) => {
        const next = new Set(state.updatingProductIds);
        next.delete(id);
        return { updatingProductIds: next };
      });
      // Refetch to keep pagination counts correct and fill the gap
      const { pagination, fetchAdminProducts } = get();
      fetchAdminProducts(pagination.currentPage);
      return true;
    } catch (error) {
      // Rollback optimistic update
      set((state) => {
        const next = new Set(state.updatingProductIds);
        next.delete(id);
        return {
          updatingProductIds: next,
          products: prevProducts,
          inventoryCounts: prevInventoryCounts,
          error: error.response?.data?.message || 'Failed to delete product',
        };
      });
      return false;
    }
  },

  // ── Bulk Selection Actions ─────────────────────────────────────────────────

  /**
   * Toggle a single product's selection state.
   * Uses product ID as key — not row index.
   */
  toggleProductSelection: (id) => {
    set((state) => {
      const next = new Set(state.selectedProductIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedProductIds: next };
    });
  },

  /**
   * Replace selection with the given array of IDs (used for Select All).
   * Passing an empty array effectively clears.
   */
  selectProductIds: (ids) => {
    set({ selectedProductIds: new Set(ids) });
  },

  /**
   * Clear all selections — called after bulk delete or manual clear.
   * NOT called on pagination / search / sort / filter changes.
   */
  clearSelection: () => {
    set({ selectedProductIds: new Set() });
  },

  /**
   * Bulk-delete all currently selected products.
   * Calls the transactional admin endpoint, then refetches + clears selection.
   */
  bulkDeleteProducts: async () => {
    const ids = [...get().selectedProductIds];
    if (ids.length === 0) return { success: false, deleted: 0 };

    set({ isBulkDeleting: true, error: null });
    try {
      const result = await productService.bulkDeleteProducts(ids);
      const deleted = result?.data?.deleted ?? ids.length;

      // Clear selection first
      set({ selectedProductIds: new Set(), isBulkDeleting: false });

      // Refetch current page — adjust page if it no longer exists
      const { pagination, fetchAdminProducts, filters } = get();
      const newFilteredItems = Math.max(0, (pagination.filteredItems || pagination.totalItems) - deleted);
      const newTotalPages = Math.max(1, Math.ceil(newFilteredItems / (pagination.itemsPerPage || 10)));
      const safePage = Math.min(pagination.currentPage, newTotalPages);
      fetchAdminProducts(safePage);

      return { success: true, deleted };
    } catch (error) {
      set({
        isBulkDeleting: false,
        error: error.response?.data?.message || 'Bulk delete failed',
      });
      return { success: false, deleted: 0 };
    }
  },

  /**
   * Fetch all matching product IDs for the current filter context.
   * Called when the header checkbox is clicked (Select All).
   */
  fetchFilteredProductIds: async (queryParams = {}) => {
    try {
      let stockStatus;
      if (queryParams.inventoryTab === 'active') stockStatus = 'active';
      else if (queryParams.inventoryTab === 'outOfStock') stockStatus = 'outOfStock';

      const result = await productService.getAdminFilteredProductIds({
        ...queryParams,
        stockStatus,
      });
      return result?.data?.ids || [];
    } catch (error) {
      console.error('Failed to fetch filtered product IDs:', error);
      return [];
    }
  },

  // ── Image Management Actions ────────────────────────────────────────────────

  /**
   * Upload images for a product. Updates the product's images in local state.
   * @param {string} productId
   * @param {FileList|File[]} files
   * @param {(n: number) => void} onProgress
   */
  uploadProductImages: async (productId, files, onProgress) => {
    try {
      const { data } = await productService.uploadProductImages(productId, files, onProgress);
      const newImages = data?.images || [];

      // Patch the product in local state with new images
      set((state) => ({
        products: state.products.map((p) => {
          if (p.id !== productId) return p;
          const merged = [...(p.images || []), ...newImages];
          const primaryImg = merged.find(i => i.isPrimary) ?? merged[0] ?? null;
          return {
            ...p,
            images: merged,
            thumbnail: primaryImg?.url ?? p.thumbnail,
            galleryImages: merged.filter(i => !i.isPrimary).map(i => i.url),
          };
        }),
        // Also patch single product view
        product: state.product?.id === productId
          ? (() => {
              const merged = [...(state.product.images || []), ...newImages];
              const primaryImg = merged.find(i => i.isPrimary) ?? merged[0] ?? null;
              return {
                ...state.product,
                images: merged,
                thumbnail: primaryImg?.url ?? state.product.thumbnail,
                galleryImages: merged.filter(i => !i.isPrimary).map(i => i.url),
              };
            })()
          : state.product,
      }));
      return { success: true, images: newImages };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Upload failed' };
    }
  },

  /**
   * Delete a product image. Enforces minimum 1 image on the backend.
   */
  deleteProductImage: async (productId, imageId) => {
    try {
      await productService.deleteProductImage(productId, imageId);

      set((state) => {
        const patchImages = (imgs) => {
          const updated = (imgs || []).filter(i => i.id !== imageId);
          // If deleted image was primary, mark next as primary
          if (updated.length > 0 && !updated.some(i => i.isPrimary)) {
            updated[0] = { ...updated[0], isPrimary: true };
          }
          return updated;
        };

        return {
          products: state.products.map((p) => {
            if (p.id !== productId) return p;
            const imgs = patchImages(p.images);
            const primaryImg = imgs.find(i => i.isPrimary) ?? imgs[0] ?? null;
            return {
              ...p,
              images: imgs,
              thumbnail: primaryImg?.url ?? null,
              galleryImages: imgs.filter(i => !i.isPrimary).map(i => i.url),
            };
          }),
          product: state.product?.id === productId
            ? (() => {
                const imgs = patchImages(state.product.images);
                const primaryImg = imgs.find(i => i.isPrimary) ?? imgs[0] ?? null;
                return {
                  ...state.product,
                  images: imgs,
                  thumbnail: primaryImg?.url ?? null,
                  galleryImages: imgs.filter(i => !i.isPrimary).map(i => i.url),
                };
              })()
            : state.product,
        };
      });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Delete failed' };
    }
  },

  /**
   * Set a specific image as primary.
   */
  setPrimaryImage: async (productId, imageId) => {
    try {
      await productService.setPrimaryProductImage(productId, imageId);

      set((state) => {
        const patchImages = (imgs) =>
          (imgs || []).map(i => ({ ...i, isPrimary: i.id === imageId }));

        return {
          products: state.products.map((p) => {
            if (p.id !== productId) return p;
            const imgs = patchImages(p.images);
            const primary = imgs.find(i => i.isPrimary);
            return {
              ...p,
              images: imgs,
              thumbnail: primary?.url ?? p.thumbnail,
              galleryImages: imgs.filter(i => !i.isPrimary).map(i => i.url),
            };
          }),
          product: state.product?.id === productId
            ? (() => {
                const imgs = patchImages(state.product.images);
                const primary = imgs.find(i => i.isPrimary);
                return {
                  ...state.product,
                  images: imgs,
                  thumbnail: primary?.url ?? state.product.thumbnail,
                  galleryImages: imgs.filter(i => !i.isPrimary).map(i => i.url),
                };
              })()
            : state.product,
        };
      });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to set primary' };
    }
  },

  /**
   * Reorder images for a product.
   * @param {string} productId
   * @param {string[]} orderedIds - Image IDs in new order
   */
  reorderImages: async (productId, orderedIds) => {
    try {
      await productService.reorderProductImages(productId, orderedIds);

      set((state) => {
        const patchImages = (imgs) => {
          const map = Object.fromEntries((imgs || []).map(i => [i.id, i]));
          return orderedIds
            .filter(id => map[id])
            .map((id, index) => ({ ...map[id], displayOrder: index }));
        };

        return {
          products: state.products.map((p) => {
            if (p.id !== productId) return p;
            const imgs = patchImages(p.images);
            return { ...p, images: imgs };
          }),
          product: state.product?.id === productId
            ? { ...state.product, images: patchImages(state.product.images) }
            : state.product,
        };
      });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Reorder failed' };
    }
  },
}));

export default useProductStore;
