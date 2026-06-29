/**
 * Cloudinary Transformation Utility
 * 
 * Intercepts raw Cloudinary URLs and injects transformation parameters
 * for optimized delivery.
 */

export const getOptimizedUrl = (url, variant = 'thumbnail') => {
  if (!url) return '';
  
  // Only process Cloudinary URLs
  if (!url.includes('res.cloudinary.com')) return url;

  // Split URL into parts to inject transformations
  // Format: https://res.cloudinary.com/<cloud_name>/image/upload/<version>/<public_id>
  // We need to inject transformations before the <public_id> or <version> if present.
  
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;
  
  const baseUrl = url.substring(0, uploadIndex + 8); // includes '/upload/'
  const path = url.substring(uploadIndex + 8);
  
  // Transformations based on Shopify/Amazon standards
  let transformations = '';
  switch (variant) {
    case 'thumbnail':
      // Square thumbnail for carts, nav, small lists
      transformations = 'c_fill,w_150,h_150,q_auto,f_auto';
      break;
    case 'card':
      // Square image for product listing cards
      transformations = 'c_fill,w_600,h_600,q_auto,f_auto';
      break;
    case 'detail':
      // High resolution contain for product detail page preview
      transformations = 'c_fit,w_1200,h_1200,q_auto,f_auto';
      break;
    case 'zoom':
      // Full resolution optimized
      transformations = 'q_auto,f_auto';
      break;
    default:
      transformations = 'q_auto,f_auto';
  }
  
  return `${baseUrl}${transformations}/${path}`;
};
