import { create } from "zustand";

const useUIStore = create((set) => ({
  isCategorySticky: false,
  setCategorySticky: (isSticky) => set({ isCategorySticky: isSticky }),
}));

export default useUIStore;
