/**
 * Shipping Utility Functions
 * Single source of truth for shipping calculations on the frontend.
 * Relies on the global settings store to fetch threshold and charges.
 */

export const calculateShipping = (subtotal, publicConfig) => {
  // If settings haven't loaded yet, return -1 to signal UI to show loading/calculating state
  if (!publicConfig || !publicConfig.shipping) {
    return {
      fee: -1,
      remainingForFree: 0,
      isFree: false,
      threshold: 0,
    };
  }

  const shippingSettings = publicConfig.shipping;

  // Safe fallbacks if backend accidentally omits them but the object exists
  const threshold = shippingSettings.freeShippingThreshold ?? Infinity;
  const charge = shippingSettings.standardDeliveryCharge ?? 99;

  const isFree = subtotal >= threshold;
  const remainingForFree = Math.max(0, threshold - subtotal);
  const fee = isFree ? 0 : charge;

  return {
    fee,
    remainingForFree,
    isFree,
    threshold,
  };
};
