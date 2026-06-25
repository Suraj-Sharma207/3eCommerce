import { create } from 'zustand';
import api from '../services/api';
import { parseError } from '../utils/errorParser';

const useUserStore = create((set, get) => ({
  profile: null,
  stats: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      const user = response.data.data.user;
      set({ profile: user, error: null });
      
      // Sync with auth store
      import('./authStore').then(module => {
        module.default.setState(state => ({
          user: user
        }));
      });
      return true;
    } catch (error) {
      set({ 
        error: parseError(error, 'Failed to fetch profile')
      });
      return false;
    }
  },

  fetchStats: async () => {
    try {
      const response = await api.get('/users/profile/stats');
      set({ stats: response.data.data.stats });
      return true;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return false;
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put('/users/profile', data);
      const user = response.data.data.user;
      set({ profile: user, isLoading: false });
      
      // Sync with auth store
      import('./authStore').then(module => {
        module.default.setState(state => ({
          user: user // Complete overwrite with full updated user object
        }));
      });
      return true;
    } catch (error) {
      set({ 
        error: parseError(error, 'Failed to update profile'), 
        isLoading: false 
      });
      return false;
    }
  },

  uploadAvatar: async (file, isAdmin = false) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const endpoint = isAdmin ? '/admin/profile/avatar' : '/users/profile/avatar';
      const response = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const user = response.data.data.user;
      set({ profile: user, isLoading: false });
      
      // Sync with auth store
      import('./authStore').then(module => {
        module.default.setState(state => ({
          user: user // Full updated user object
        }));
      });
      
      return true;
    } catch (error) {
      const parsed = parseError(error, 'Failed to upload avatar');
      set({ 
        error: parsed, 
        isLoading: false 
      });
      throw new Error(parsed);
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await api.put('/users/profile/password', { currentPassword, newPassword });
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ 
        error: parseError(error, 'Failed to change password'), 
        isLoading: false 
      });
      return false;
    }
  },
  
  clearProfile: () => {
    set({ profile: null, stats: null, error: null });
  }
}));

export default useUserStore;
