import { create } from 'zustand';
import api from '../services/api'; // Assuming you have an api.js

export const useBrandingStore = create((set, get) => ({
  branding: {
    platformName: 'LuxeHome', // Default fallback
    logoUrl: null
  },
  loading: false,
  uploading: false,

  fetchBranding: async () => {
    try {
      set({ loading: true });
      // Fetch public branding settings
      const response = await api.get('/admin/branding');
      if (response.data.success && response.data.data) {
        set({ branding: response.data.data });
      }
    } catch (error) {
      console.error('Failed to fetch branding', error);
      // Fallback remains if fetch fails
    } finally {
      set({ loading: false });
    }
  },

  updateBranding: async (data) => {
    try {
      set({ uploading: true });
      const response = await api.put('/admin/branding', data);
      if (response.data.success && response.data.data) {
        set({ branding: response.data.data });
        return true;
      }
    } catch (error) {
      console.error('Failed to update branding', error);
      throw error;
    } finally {
      set({ uploading: false });
    }
    return false;
  },

  uploadLogo: async (file) => {
    try {
      set({ uploading: true });
      const formData = new FormData();
      formData.append('logo', file);

      const response = await api.post('/admin/branding/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.data) {
        set({ branding: response.data.data });
        return true;
      }
    } catch (error) {
      console.error('Failed to upload logo', error);
      throw error;
    } finally {
      set({ uploading: false });
    }
    return false;
  }
}));
