/**
 * Centralized Form Validators and Input Sanitizers.
 * Every returned error string MUST end with a full stop (.).
 */

export const validateEmail = (email) => {
  if (!email) return 'Email is required.';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Enter a valid email address.';
  return '';
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character.';
  return '';
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Confirm password is required.';
  if (password !== confirmPassword) return 'Passwords do not match.';
  return '';
};

export const validatePhone = (phone) => {
  if (!phone) return 'Phone number is required.';
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length !== 10) return 'Enter a valid 10-digit phone number.';
  return '';
};

export const validateName = (name, label = 'Name') => {
  if (!name || !name.trim()) return `${label} is required.`;
  const nameStr = name.trim();
  if (nameStr.length < 2 || nameStr.length > 80) {
    return `${label} must be between 2 and 80 characters.`;
  }
  if (!/^[A-Za-z\s'-]+$/.test(nameStr)) {
    return `${label} must contain only letters.`;
  }
  return '';
};

export const validatePrice = (price) => {
  const val = parseFloat(price);
  if (isNaN(val) || val <= 0) return 'Price must be greater than 0.';
  return '';
};

export const validateDiscount = (discount) => {
  if (discount === undefined || discount === '') return '';
  const val = parseInt(discount, 10);
  if (isNaN(val) || val < 0 || val > 90) return 'Discount must be between 0% and 90%.';
  return '';
};

export const validateStock = (stock) => {
  if (stock === undefined || stock === '') return 'Stock quantity is required.';
  const val = Number(stock);
  if (!Number.isInteger(val) || val < 0) return 'Enter a valid stock quantity.';
  return '';
};

export const validateRequired = (value, label = 'Field') => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return `${label} is required.`;
  }
  return '';
};

/**
 * Filters input change value to permit digits only.
 * Useful for Phone, Age, OTP, and Quantity.
 */
export const sanitizeNumeric = (val) => {
  return String(val).replace(/\D/g, '');
};

/**
 * Filters input change value to permit float/decimal digits only.
 * Useful for Price.
 */
export const sanitizeDecimal = (val) => {
  let cleaned = String(val).replace(/[^0-9.]/g, '');
  // Prevent multiple decimal points
  const dotIndex = cleaned.indexOf('.');
  if (dotIndex !== -1) {
    cleaned = cleaned.substring(0, dotIndex + 1) + cleaned.substring(dotIndex + 1).replace(/\./g, '');
  }
  return cleaned;
};
