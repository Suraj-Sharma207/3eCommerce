import { create } from "zustand";
import settingsService from "../services/settingsService";

let fetchPublicConfigPromise = null;

const useSettingsStore = create((set, get) => ({
  publicConfig: null,
  domains: {
    store: { data: {}, isLoading: false, isSaving: false },
    shipping: { data: {}, isLoading: false, isSaving: false },
    payment: { data: {}, isLoading: false, isSaving: false },
    smtp: { data: {}, isLoading: false, isSaving: false },
    security: { data: {}, isLoading: false, isSaving: false },
    notifications: { data: {}, isLoading: false, isSaving: false },
  },
  error: null,
  isTestingSmtp: false,

  fetchPublicConfig: async () => {
    if (fetchPublicConfigPromise) return fetchPublicConfigPromise;
    fetchPublicConfigPromise = (async () => {
      try {
        const { data } = await settingsService.getPublicConfig();
        set({ publicConfig: data || {} });
      } catch (error) {
        console.error("Failed to fetch public config");
      } finally {
        fetchPublicConfigPromise = null;
      }
    })();
    return fetchPublicConfigPromise;
  },

  fetchDomainSettings: async (domain) => {
    set((state) => ({
      domains: {
        ...state.domains,
        [domain]: { ...state.domains[domain], isLoading: true },
      },
      error: null,
    }));
    try {
      const { data } = await settingsService.getDomainSettings(domain);
      set((state) => ({
        domains: {
          ...state.domains,
          [domain]: { data: data || {}, isLoading: false, isSaving: false },
        },
      }));
    } catch (error) {
      set((state) => ({
        domains: {
          ...state.domains,
          [domain]: { ...state.domains[domain], isLoading: false },
        },
        error:
          error.response?.data?.message || `Failed to fetch ${domain} settings`,
      }));
    }
  },

  updateDomainSettings: async (domain, newData) => {
    set((state) => ({
      domains: {
        ...state.domains,
        [domain]: { ...state.domains[domain], isSaving: true },
      },
      error: null,
    }));
    try {
      const { data } = await settingsService.updateDomainSettings(
        domain,
        newData,
      );
      set((state) => ({
        domains: {
          ...state.domains,
          [domain]: { data: data || {}, isLoading: false, isSaving: false },
        },
      }));
      return true;
    } catch (error) {
      set((state) => ({
        domains: {
          ...state.domains,
          [domain]: { ...state.domains[domain], isSaving: false },
        },
        error:
          error.response?.data?.message ||
          `Failed to update ${domain} settings`,
      }));
      return false;
    }
  },

  testSmtpConnection: async (smtpData) => {
    set({ isTestingSmtp: true, error: null });
    try {
      await settingsService.testSmtp(smtpData);
      set({ isTestingSmtp: false });
      return { success: true };
    } catch (error) {
      set({ isTestingSmtp: false });
      return {
        success: false,
        message: error.response?.data?.message || "SMTP Test failed",
      };
    }
  },
}));

export default useSettingsStore;
