import { create } from 'zustand';
import promotionService from '../services/promotionService';

const usePromotionStore = create((set) => ({
  promotions: [],
  isLoading: false,
  error: null,

  fetchPromotions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await promotionService.getPromotions();
      set({ promotions: data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch promotions', isLoading: false });
    }
  },

  createPromotion: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await promotionService.createPromotion(data);
      const { data: newPromotions } = await promotionService.getPromotions();
      set({ promotions: newPromotions, isLoading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to create promotion', isLoading: false });
      return false;
    }
  },

  updatePromotion: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await promotionService.updatePromotion(id, data);
      const { data: newPromotions } = await promotionService.getPromotions();
      set({ promotions: newPromotions, isLoading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to update promotion', isLoading: false });
      return false;
    }
  },

  deletePromotion: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await promotionService.deletePromotion(id);
      const { data: newPromotions } = await promotionService.getPromotions();
      set({ promotions: newPromotions, isLoading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to delete promotion', isLoading: false });
      return false;
    }
  }
}));

export default usePromotionStore;
