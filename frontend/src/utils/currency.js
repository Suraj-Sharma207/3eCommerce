/**
 * Standardizes currency formatting across the application to Indian Rupees (INR).
 * 
 * @param {number} amount - The amount to format.
 * @returns {string} - The formatted currency string (e.g., ₹7,649.15).
 */
import useSettingsStore from '../store/settingsStore';

export const formatPrice = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    amount = 0;
  }
  
  const publicConfig = useSettingsStore.getState().publicConfig;
  const currency = publicConfig?.currency || 'INR';
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
