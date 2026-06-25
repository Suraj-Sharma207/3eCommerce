import api from './api';

const getProducts = async ({ page = 1, limit = 12, search = '', category, brand, minRating, minPrice, maxPrice, inStock, sale, sort }) => {
  const params = { page, limit, search };
  
  if (category && category !== 'All') params.category = category;
  if (brand && brand !== 'All') params.brand = brand;
  if (minRating !== undefined && minRating !== '') params.minRating = minRating;
  if (minPrice !== undefined && minPrice !== '') params.minPrice = minPrice;
  if (maxPrice !== undefined && maxPrice !== '') params.maxPrice = maxPrice;
  if (inStock) params.inStock = inStock;
  if (sale) params.sale = sale;
  if (sort) params.sort = sort;

  const response = await api.get('/products', { params });
  return response.data;
};

const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
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

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
