import api from './api';

const getCustomers = async (params, options = {}) => {
  const response = await api.get('/admin/customers', { params, ...options });
  return response.data;
};

const getCustomerById = async (id) => {
  const response = await api.get(`/admin/customers/${id}`);
  return response.data;
};

const updateCustomerStatus = async (id, active) => {
  const response = await api.put(`/admin/customers/${id}/status`, { active });
  return response.data;
};

export default {
  getCustomers,
  getCustomerById,
  updateCustomerStatus,
};
