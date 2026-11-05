import React, { useState, useEffect, useCallback } from "react";
import CookieContext from "./CookieContext";
import {
  getCookieConsent,
  setCookieConsent,
  clearCookieConsent,
  CONSENT_VERSION,
} from "../../utils/cookies";
import useAuthStore from "../../store/authStore";
import api from "../../services/api";

export const CookieProvider = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const [consent, setConsentState] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize consent from local storage or backend
  useEffect(() => {
    const initConsent = async () => {
      let localConsent = getCookieConsent();

      if (isAuthenticated) {
        try {
          const res = await api.get("/users/cookie-consent");
          if (res.data?.data?.consent) {
            const serverConsent = res.data.data.consent;
            if (serverConsent.version === CONSENT_VERSION) {
              localConsent = setCookieConsent({
                analytics: serverConsent.analytics,
                functional: serverConsent.functional,
                marketing: serverConsent.marketing,
                necessary: serverConsent.necessary,
              });
            }
          }
        } catch (error) {
          console.error("Failed to fetch consent from server", error);
        }
      }

      setConsentState(localConsent);
      setShowBanner(!localConsent);
      setIsInitializing(false);
    };

    initConsent();
  }, [isAuthenticated]);

  const saveConsent = useCallback(
    async (preferences) => {
      const payload = setCookieConsent(preferences);
      setConsentState(payload);
      setShowBanner(false);
      setShowPreferences(false);

      if (isAuthenticated) {
        try {
          await api.post("/users/cookie-consent", {
            ...payload,
            version: CONSENT_VERSION,
          });
        } catch (error) {
          console.error("Failed to sync consent to server", error);
        }
      }
    },
    [isAuthenticated],
  );

  const acceptAll = useCallback(() => {
    saveConsent({
      analytics: true,
      functional: true,
      marketing: true,
      necessary: true,
    });
  }, [saveConsent]);

  const rejectNonEssential = useCallback(() => {
    saveConsent({
      analytics: false,
      functional: false,
      marketing: false,
      necessary: true,
    });
  }, [saveConsent]);

  const openPreferences = useCallback(() => {
    setShowPreferences(true);
  }, []);

  const closePreferences = useCallback(() => {
    setShowPreferences(false);
  }, []);

  const value = {
    consent,
    showBanner,
    showPreferences,
    isInitializing,
    acceptAll,
    rejectNonEssential,
    saveConsent,
    openPreferences,
    closePreferences,
  };

  return (
    <CookieContext.Provider value={value}>{children}</CookieContext.Provider>
  );
};
