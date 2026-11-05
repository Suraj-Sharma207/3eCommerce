import { create } from "zustand";

const useConfirmStore = create((set) => ({
  isOpen: false,
  config: null,
  resolve: null,

  confirm: (config) =>
    new Promise((resolve) => {
      set({ isOpen: true, config, resolve });
    }),

  alert: (config) =>
    new Promise((resolve) => {
      set({ isOpen: true, config: { ...config, isAlert: true }, resolve });
    }),

  onConfirm: () => {
    set((state) => {
      if (state.resolve) state.resolve(true);
      return { isOpen: false, resolve: null };
    });
  },

  onCancel: () => {
    set((state) => {
      if (state.resolve) state.resolve(false);
      return { isOpen: false, resolve: null };
    });
  },
}));

export default useConfirmStore;
