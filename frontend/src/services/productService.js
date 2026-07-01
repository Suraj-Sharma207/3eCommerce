import api from './api';

const getProducts = async ({ page = 1, limit = 15, search = '', category, brand, minRating, minPrice, maxPrice, inStock, stockStatus, sale, sort, includeInventoryCounts }, options = {}) => {
  const params = { page, limit, search };
  
  if (category && category !== 'All') params.category = category;
  if (brand && brand !== 'All') params.brand = brand;
  if (minRating !== undefined && minRating !== '') params.minRating = minRating;
  if (minPrice !== undefined && minPrice !== '') params.minPrice = minPrice;
  if (maxPrice !== undefined && maxPrice !== '') params.maxPrice = maxPrice;
  if (inStock) params.inStock = inStock;
  if (stockStatus) params.stockStatus = stockStatus;
  if (sale) params.sale = sale;
  if (sort) params.sort = sort;
  if (includeInventoryCounts) params.includeInventoryCounts = includeInventoryCounts;

  const response = await api.get('/products', { params, ...options });
  return response.data;
};

const getAdminProducts = async ({ page = 1, limit = 15, search = '', category, brand, minRating, minPrice, maxPrice, inStock, stockStatus, sale, sort, includeInventoryCounts }, options = {}) => {
  const params = { page, limit, search };
  
  if (category && category !== 'All') params.category = category;
  if (brand && brand !== 'All') params.brand = brand;
  if (minRating !== undefined && minRating !== '') params.minRating = minRating;
  if (minPrice !== undefined && minPrice !== '') params.minPrice = minPrice;
  if (maxPrice !== undefined && maxPrice !== '') params.maxPrice = maxPrice;
  if (inStock) params.inStock = inStock;
  if (stockStatus) params.stockStatus = stockStatus;
  if (sale) params.sale = sale;
  if (sort) params.sort = sort;
  if (includeInventoryCounts) params.includeInventoryCounts = includeInventoryCounts;

  const response = await api.get('/admin/products', { params, ...options });
  return response.data;
};

const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

const getProductsHome = async () => {
  const response = await api.get('/home/all');
  return response.data;
};

const getRecommendedProducts = async () => {
  const response = await api.get('/products/recommended');
  return response.data;
};

const createProduct = async (productData) => {
  const response = await api.post('/products', productData);
  return response.data;
};

const updateProduct = async (id, productData) => {
  const response = await api.put(`/products/${id}`, productData);
  return response.data;
};

const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

const getCategories = async () => {
  const response = await api.get('/products/categories');
  return response.data;
};

// ── Image Management ──────────────────────────────────────────────────────────

/**
 * Upload one or more images for a product.
 * @param {string} productId
 * @param {FileList|File[]} files
 * @param {(progress: number) => void} onProgress - optional upload progress callback
 */
const uploadProductImages = async (productId, files, onProgress) => {
  const formData = new FormData();
  Array.from(files).forEach(file => formData.append('images', file));

  const response = await api.post(`/products/${productId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
      : undefined,
  });
  return response.data;
};

/**
 * Delete a product image.
 * @param {string} productId
 * @param {string} imageId
 */
const deleteProductImage = async (productId, imageId) => {
  const response = await api.delete(`/products/${productId}/images/${imageId}`);
  return response.data;
};

/**
 * Set an image as the primary image.
 * @param {string} productId
 * @param {string} imageId
 */
const setPrimaryProductImage = async (productId, imageId) => {
  const response = await api.put(`/products/${productId}/images/${imageId}/primary`);
  return response.data;
};

/**
 * Reorder product images.
 * @param {string} productId
 * @param {string[]} orderedIds - Array of image IDs in new display order
 */
const reorderProductImages = async (productId, orderedIds) => {
  const response = await api.put(`/products/${productId}/images/reorder`, { orderedIds });
  return response.data;
};

/**
 * Get all images for a product.
 * @param {string} productId
 */
const getProductImages = async (productId) => {
  const response = await api.get(`/products/${productId}/images`);
  return response.data;
};

export default {
  getProducts,
  getAdminProducts,
  getProductById,
  getProductsHome,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  uploadProductImages,
  deleteProductImage,
  setPrimaryProductImage,
  reorderProductImages,
  getProductImages,
  getRecommendedProducts,
};
