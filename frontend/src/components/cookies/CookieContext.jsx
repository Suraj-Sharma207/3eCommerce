import { createContext, useContext } from "react";

const CookieContext = createContext(null);

export const useCookieConsent = () => {
  const context = useContext(CookieContext);
  if (!context) {
    throw new Error("useCookieConsent must be used within a CookieProvider");
  }
  return context;
};

export default CookieContext;
