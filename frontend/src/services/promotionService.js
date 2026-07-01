import api from './api';

const getPromotions = async (params, options = {}) => {
  const response = await api.get('/promotions', { params, ...options });
  return response.data;
};

const createPromotion = async (data) => {
  const response = await api.post('/promotions', data);
  return response.data;
};

const updatePromotion = async (id, data) => {
  const response = await api.put(`/promotions/${id}`, data);
  return response.data;
};

const deletePromotion = async (id) => {
  const response = await api.delete(`/promotions/${id}`);
  return response.data;
};

export default {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
};
