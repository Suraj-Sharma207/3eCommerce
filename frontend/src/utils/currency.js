/**
 * Standardizes currency formatting across the application to Indian Rupees (INR).
 * 
 * @param {number} amount - The amount to format.
 * @returns {string} - The formatted currency string (e.g., ₹7,649.15).
 */
export const formatPrice = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    amount = 0;
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
