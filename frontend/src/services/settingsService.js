import api from './api';

const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

const updateSettings = async (settingsData) => {
  const response = await api.put('/settings', settingsData);
  return response.data;
};

export default {
  getSettings,
  updateSettings,
};
