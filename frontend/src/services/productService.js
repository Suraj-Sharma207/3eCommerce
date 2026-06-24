import api from './api';

const getProducts = async ({ page = 1, limit = 12, search = '', category, minPrice, maxPrice, inStock, sort }) => {
  const params = { page, limit, search };
  
  if (category && category !== 'All') params.category = category;
  if (minPrice !== undefined && minPrice !== '') params.minPrice = minPrice;
  if (maxPrice !== undefined && maxPrice !== '') params.maxPrice = maxPrice;
  if (inStock) params.inStock = inStock;
  if (sort) params.sort = sort;

  const response = await api.get('/products', { params });
  return response.data;
};

const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export default {
  getProducts,
  getProductById,
};
