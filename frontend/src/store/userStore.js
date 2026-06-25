import { create } from 'zustand';
import api from '../services/api';

const useUserStore = create((set) => ({
  profile: null,
  isLoading: false,
  error: null,
  hasLoadedInitial: false,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/users/profile');
      set({ profile: response.data.data.user, isLoading: false, hasLoadedInitial: true });
      return true;
    } catch (error) {
      // Keep existing profile if already loaded
      set({ 
        error: error.response?.data?.message || 'Failed to fetch profile', 
        isLoading: false,
        hasLoadedInitial: true // Mark as loaded even if failed so we can show error state
      });
      return false;
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put('/users/profile', data);
      set({ profile: response.data.data.user, isLoading: false });
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to update profile', 
        isLoading: false 
      });
      return false;
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
        error: error.response?.data?.message || 'Failed to change password', 
        isLoading: false 
      });
      return false;
    }
  },
  
  clearProfile: () => {
    set({ profile: null, error: null, hasLoadedInitial: false });
  }
}));

export default useUserStore;
