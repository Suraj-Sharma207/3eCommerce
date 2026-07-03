// Utility for managing cookies in localStorage (or actual browser cookies if preferred)
// Using localStorage as it's cleaner for SPA consent management

const CONSENT_KEY = 'ecommerce_cookie_consent';
export const CONSENT_VERSION = 'v1.0';

export const getCookieConsent = () => {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    
    // If the version changes in code, invalidate the previous consent
    if (parsed.version !== CONSENT_VERSION) {
      localStorage.removeItem(CONSENT_KEY);
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error('Error reading cookie consent', error);
    return null;
  }
};

export const setCookieConsent = (preferences) => {
  try {
    const payload = {
      ...preferences,
      version: CONSENT_VERSION,
      acceptedAt: new Date().toISOString()
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
    return payload;
  } catch (error) {
    console.error('Error saving cookie consent', error);
  }
};

export const clearCookieConsent = () => {
  localStorage.removeItem(CONSENT_KEY);
};
