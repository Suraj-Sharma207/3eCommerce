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
    itemsPerPage: 12,
  },

  fetchHomeProducts: async () => {
    if (get().hasFetchedHome) return;
    try {
      const response = await productService.getProductsHome();
      const data = response.data?.data || {};
      set({ 
        homeProducts: {
          featured: data.featured || [],
          trending: data.trending || [],
          newArrivals: data.newArrivals || [],
          bestSellers: data.bestSellers || [],
          sale: data.sale || []
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
        includeInventoryCounts: true
      });
      
      set({
        products: data.products,
        pagination: data.pagination,
        inventoryCounts: data.pagination?.inventoryCounts || get().inventoryCounts,
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
      set((state) => {
        // Only append to the current view if it belongs there
        let shouldAppend = false;
        if (state.filters.inventoryTab === 'all') shouldAppend = true;
        else if (state.filters.inventoryTab === 'active' && newProduct.stock > 0) shouldAppend = true;
        else if (state.filters.inventoryTab === 'outOfStock' && newProduct.stock === 0) shouldAppend = true;

        const updatedProducts = shouldAppend ? [newProduct, ...state.products] : state.products;
        
        return {
          isLoading: false,
          products: updatedProducts,
          pagination: {
            ...state.pagination,
            totalItems: shouldAppend ? state.pagination.totalItems + 1 : state.pagination.totalItems,
          },
          inventoryCounts: {
            all: state.inventoryCounts.all + 1,
            active: newProduct.stock > 0 ? state.inventoryCounts.active + 1 : state.inventoryCounts.active,
            outOfStock: newProduct.stock === 0 ? state.inventoryCounts.outOfStock + 1 : state.inventoryCounts.outOfStock,
          }
        };
      });
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

    // Optimistically remove the product from the list
    set((state) => {
      const wasActive = deletedProduct?.stock > 0;
      const wasOutOfStock = deletedProduct?.stock === 0;

      return {
        products: state.products.filter((p) => p.id !== id),
        updatingProductIds: new Set([...state.updatingProductIds, id]),
        pagination: {
          ...state.pagination,
          totalItems: Math.max(0, state.pagination.totalItems - 1),
        },
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
          inventoryCounts: state.inventoryCounts, // Simplified rollback for inventory
          error: error.response?.data?.message || 'Failed to delete product',
        };
      });
      return false;
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
