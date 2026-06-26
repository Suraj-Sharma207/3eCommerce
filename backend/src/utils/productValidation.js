export const validateProductInput = (data) => {
  const errors = {};

  // 1. Product Name
  if (!data.name) {
    errors.name = 'Please enter a valid product name.';
  } else {
    const nameStr = String(data.name).trim();
    if (nameStr.length < 2 || nameStr.length > 100) {
      errors.name = 'Product name must be between 2 and 100 characters.';
    } else if (!/^[A-Za-z0-9\s&'.,()-]+$/.test(nameStr)) {
      errors.name = 'Please enter a valid product name.';
    }
  }

  // 2. Category
  const validCategories = [
    'Living Room',
    'Bedroom',
    'Dining Room',
    'Office',
    'Outdoor',
    'Kitchen',
    'Decor',
    'Lighting'
  ];
  if (!data.category || !validCategories.includes(String(data.category).trim())) {
    errors.category = 'Please select a valid category from the list.';
  }

  // 3. Brand — allow letters, numbers, spaces, and common punctuation
  if (!data.brand) {
    errors.brand = 'Please enter a valid brand name.';
  } else {
    const brandStr = String(data.brand).trim();
    if (brandStr.length < 2 || brandStr.length > 50) {
      errors.brand = 'Brand must be between 2 and 50 characters.';
    } else if (!/^[A-Za-z0-9\s&'.,_-]+$/.test(brandStr)) {
      errors.brand = 'Please enter a valid brand name.';
    }
  }

  // 4. Price
  const price = parseFloat(data.price);
  if (isNaN(price) || price <= 0 || price > 999999) {
    errors.price = 'Price must be greater than 0.';
  }

  // 5. Discount
  if (data.discountPercentage !== undefined && data.discountPercentage !== '') {
    const discount = parseInt(data.discountPercentage, 10);
    if (isNaN(discount) || discount < 0 || discount > 90) {
      errors.discountPercentage = 'Discount cannot exceed 90%.';
    }
  }

  // 6. Stock Quantity
  if (data.stock === undefined || data.stock === '') {
    errors.stock = 'Please enter a valid stock quantity.';
  } else {
    const stock = Number(data.stock);
    if (!Number.isInteger(stock) || stock < 0 || stock > 999999) {
      errors.stock = 'Please enter a valid stock quantity.';
    }
  }

  // 7. Description
  if (!data.description) {
    errors.description = 'Description must be between 20 and 1000 characters.';
  } else {
    const descStr = String(data.description).trim().replace(/<[^>]*>?/gm, '');
    if (descStr.length < 20 || descStr.length > 1000) {
      errors.description = 'Description must be between 20 and 1000 characters.';
    }
  }

  // 8. Thumbnail URL — check `thumbnail` field (Prisma schema field name)
  const imageUrl = data.thumbnail;
  if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
    const thumbStr = imageUrl.trim();
    try {
      const parsed = new URL(thumbStr);
      const pathname = parsed.pathname.toLowerCase();
      if (!/\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(pathname)) {
        const knownImageDomains = ['unsplash.com', 'images.unsplash.com', 'cloudinary.com', 'imgix.net', 'imagekit.io', 'picsum.photos'];
        const isKnownCDN = knownImageDomains.some(d => parsed.hostname.includes(d));
        if (!isKnownCDN) {
          errors.thumbnail = 'Please enter a valid image URL (.jpg, .png, .webp, .avif, .gif, .svg).';
        }
      }
    } catch (_) {
      errors.thumbnail = 'Please enter a valid image URL.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
