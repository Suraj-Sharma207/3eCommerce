import { create } from "zustand";
import api from "../services/api";

const useAddressStore = create((set) => ({
  addresses: [],
  isLoading: false,
  error: null,

  fetchAddresses: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/addresses");
      set({ addresses: response.data.data.addresses, isLoading: false });
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch addresses",
        isLoading: false,
      });
      return false;
    }
  },

  addAddress: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/addresses", data);
      set((state) => {
        const newAddresses = [...state.addresses];
        if (data.isDefaultShipping) {
          newAddresses.forEach((a) => (a.isDefaultShipping = false));
        }
        if (data.isDefaultBilling) {
          newAddresses.forEach((a) => (a.isDefaultBilling = false));
        }
        return {
          addresses: [...newAddresses, response.data.data.address],
          isLoading: false,
        };
      });
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to add address",
        isLoading: false,
      });
      return false;
    }
  },

  updateAddress: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/addresses/${id}`, data);
      set((state) => {
        const updatedAddress = response.data.data.address;
        const newAddresses = state.addresses.map((a) =>
          a.id === id ? updatedAddress : a,
        );

        if (data.isDefaultShipping) {
          newAddresses.forEach((a) => {
            if (a.id !== id) a.isDefaultShipping = false;
          });
        }
        if (data.isDefaultBilling) {
          newAddresses.forEach((a) => {
            if (a.id !== id) a.isDefaultBilling = false;
          });
        }
        return { addresses: newAddresses, isLoading: false };
      });
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to update address",
        isLoading: false,
      });
      return false;
    }
  },

  deleteAddress: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/addresses/${id}`);
      set((state) => ({
        addresses: state.addresses.filter((a) => a.id !== id),
        isLoading: false,
      }));
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to delete address",
        isLoading: false,
      });
      return false;
    }
  },

  clearAddresses: () => {
    set({ addresses: [], error: null });
  },
}));

export default useAddressStore;
