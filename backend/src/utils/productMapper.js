/**
 * productMapper.js
 * 
 * Single source of truth for converting a Prisma Product record (with its
 * `images` relation) into the API response shape.
 *
 * Rules enforced here:
 *  - `thumbnail`    → URL of the image where isPrimary=true (fallback: first by displayOrder)
 *  - `galleryImages` → ordered array of non-primary image URLs (backward-compat)
 *  - `primaryImage`  → full ProductImage object for admin use
 *  - `images`        → full ordered array for admin image manager
 */

const PLACEHOLDER =
  'https://placehold.co/800x800/f3f4f6/9ca3af?text=No+Image';

/**
 * Derive Cloudinary transformation URLs from a base Cloudinary URL.
 * Falls back to the original URL for non-Cloudinary assets.
 */
export const getVariantUrl = (url, variant = 'medium') => {
  if (!url) return PLACEHOLDER;

  const transforms = {
    thumbnail: 'c_fill,w_150,h_150,q_auto,f_auto',
    small:     'c_fill,w_400,h_400,q_auto,f_auto',
    medium:    'c_fill,w_800,h_800,q_auto,f_auto',
    large:     'c_fill,w_1200,h_1200,q_auto,f_auto',
  };

  const t = transforms[variant];
  if (!t) return url;

  // Cloudinary URL pattern: https://res.cloudinary.com/{cloud}/{resource_type}/upload/{public_id}
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/${t}/`);
  }

  // Non-Cloudinary (e.g. Unsplash) — return as-is
  return url;
};

/**
 * Map a single Prisma Product row (with images relation) to API shape.
 * Safe to call even if `images` is undefined (e.g. older queries).
 */
export const mapProduct = (product) => {
  if (!product) return null;

  const images = Array.isArray(product.images) ? product.images : [];

  // Sort by displayOrder ascending
  const sorted = [...images].sort((a, b) => a.displayOrder - b.displayOrder);

  const primaryImg = sorted.find((i) => i.isPrimary) ?? sorted[0] ?? null;
  const gallery    = sorted.filter((i) => i !== primaryImg);

  return {
    ...product,
    // ── Backward-compatible fields ──────────────────────────────────────
    thumbnail:    primaryImg?.url ?? PLACEHOLDER,
    galleryImages: gallery.map((i) => i.url),
    // ── Rich fields for admin / ProductDetail ────────────────────────────
    primaryImage:  primaryImg ?? null,
    images:        sorted,
  };
};

/**
 * Map an array of products.
 */
export const mapProducts = (products) =>
  Array.isArray(products) ? products.map(mapProduct) : [];

export const PRODUCT_IMAGE_PLACEHOLDER = PLACEHOLDER;
