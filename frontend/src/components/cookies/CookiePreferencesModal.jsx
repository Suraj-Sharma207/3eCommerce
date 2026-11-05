import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useCookieConsent } from "./CookieContext";
import CookieToggle from "./CookieToggle";
import Button from "../ui/Button";

const CookiePreferencesModal = () => {
  const { consent, showPreferences, closePreferences, saveConsent, acceptAll } =
    useCookieConsent();

  // Local state for toggles before saving
  const [preferences, setPreferences] = useState({
    analytics: consent?.analytics || false,
    functional: consent?.functional || false,
    marketing: consent?.marketing || false,
  });

  // Sync state if modal opens and consent exists
  useEffect(() => {
    if (showPreferences && consent) {
      setPreferences({
        analytics: consent.analytics,
        functional: consent.functional,
        marketing: consent.marketing,
      });
    }
  }, [showPreferences, consent]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showPreferences) {
        closePreferences();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPreferences, closePreferences]);

  if (!showPreferences) return null;

  const handleSave = () => {
    saveConsent({
      ...preferences,
      necessary: true,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-modal-title"
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-border bg-white">
          <h2
            id="cookie-modal-title"
            className="text-xl text-text-brand-600 font-bold"
          >
            Cookie Preferences
          </h2>
          <button
            onClick={closePreferences}
            aria-label="Close"
            className="text-text-muted hover:text-text-primary p-2 hover:bg-border-light rounded-lg transition-colors font-medium"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2 flex flex-col min-h-0 bg-surface-background/50">
          <CookieToggle
            id="necessary-cookies"
            label="Necessary Cookies (Always Enabled)"
            description="Required for authentication, security, cart, checkout, payments, and website functionality."
            checked={true}
            onChange={() => {}}
            disabled={true}
          />
          <CookieToggle
            id="analytics-cookies"
            label="Analytics"
            description="Google Analytics, Heatmaps, Performance metrics to help us improve your experience."
            checked={preferences.analytics}
            onChange={(val) =>
              setPreferences((p) => ({ ...p, analytics: val }))
            }
          />
          <CookieToggle
            id="functional-cookies"
            label="Functional Cookies"
            description="Remember: language, currency, wishlist, recently viewed, and user preferences."
            checked={preferences.functional}
            onChange={(val) =>
              setPreferences((p) => ({ ...p, functional: val }))
            }
          />
          <CookieToggle
            id="marketing-cookies"
            label="Marketing Cookies"
            description="Advertising, Remarketing, Facebook Pixel, Google Ads, and Email Campaign Tracking."
            checked={preferences.marketing}
            onChange={(val) =>
              setPreferences((p) => ({ ...p, marketing: val }))
            }
          />
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-border bg-white flex flex-col sm:flex-row items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={closePreferences}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleSave}
            className="w-full sm:w-auto border-brand-200 text-brand-700 hover:bg-brand-50"
          >
            Save Selected
          </Button>
          <Button onClick={acceptAll} className="w-full sm:w-auto">
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookiePreferencesModal;
