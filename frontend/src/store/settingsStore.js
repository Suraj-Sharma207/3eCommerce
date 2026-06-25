import { create } from 'zustand';
import settingsService from '../services/settingsService';

const useSettingsStore = create((set) => ({
  settings: {},
  isLoading: false,
  isSaving: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await settingsService.getSettings();
      set({ settings: data, isLoading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch settings', 
        isLoading: false 
      });
    }
  },

  updateSettings: async (settingsData) => {
    set({ isSaving: true, error: null });
    try {
      const { data } = await settingsService.updateSettings(settingsData);
      set({ settings: data, isSaving: false });
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to update settings', 
        isSaving: false 
      });
      return false;
    }
  },
}));

export default useSettingsStore;
