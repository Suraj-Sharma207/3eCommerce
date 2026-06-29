import cloudinary from '../config/cloudinary.js';
import prisma from '../lib/prisma.js';
import productRepository from '../repositories/productRepository.js';

/** Allowed MIME types */
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MIN_RESOLUTION = 800; // px

/** Eager Cloudinary transforms for consistent variants */
const EAGER_TRANSFORMS = [
  { width: 150,  height: 150,  crop: 'fill', quality: 'auto', fetch_format: 'auto' },
  { width: 400,  height: 400,  crop: 'fill', quality: 'auto', fetch_format: 'auto' },
  { width: 800,  height: 800,  crop: 'fill', quality: 'auto', fetch_format: 'auto' },
  { width: 1200, height: 1200, crop: 'fill', quality: 'auto', fetch_format: 'auto' },
];

/**
 * Upload a single buffer to Cloudinary.
 * Returns Cloudinary response with secure_url, public_id, width, height, format, bytes.
 */
const uploadToCloudinary = (buffer, mimetype, productId, filename = '') => {
  return new Promise((resolve, reject) => {
    const b64 = Buffer.from(buffer).toString('base64');
    const dataUri = `data:${mimetype};base64,${b64}`;

    cloudinary.uploader.upload(dataUri, {
      folder: `products/${productId}`,
      resource_type: 'image',
      eager: EAGER_TRANSFORMS,
      eager_async: false,
      use_filename: true,
      unique_filename: true,
    }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
};

/**
 * Upload a single Unsplash URL to Cloudinary (used during seeding).
 */
const uploadUrlToCloudinary = (url, productId, publicIdHint = '') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(url, {
      folder: `products/${productId}`,
      resource_type: 'image',
      eager: EAGER_TRANSFORMS,
      eager_async: false,
      use_filename: false,
      unique_filename: true,
      public_id: publicIdHint || undefined,
    }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
};

class ProductImageService {
  /**
   * Validate a file before upload.
   * Throws descriptive errors for invalid files.
   */
  validateFile(file) {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw {
        statusCode: 400,
        message: `Invalid file type: ${file.mimetype}. Allowed: JPG, JPEG, PNG, WEBP`,
      };
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw {
        statusCode: 400,
        message: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: 5MB`,
      };
    }
  }

  /**
   * Upload multiple files for a product.
   * Each upload is atomic at the DB level via individual inserts.
   * If any upload fails, already-created DB rows are rolled back.
   */
  async uploadImages(productId, files) {
    if (!files || files.length === 0) {
      throw { statusCode: 400, message: 'No files provided' };
    }

    // Validate all files first before any upload
    files.forEach(f => this.validateFile(f));

    const existingCount = await productRepository.countImages(productId);
    const createdImages = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await uploadToCloudinary(file.buffer, file.mimetype, productId, file.originalname);

        // Enforce minimum resolution
        if (result.width < MIN_RESOLUTION || result.height < MIN_RESOLUTION) {
          // Delete from Cloudinary since it doesn't meet requirements
          await cloudinary.uploader.destroy(result.public_id).catch(() => {});
          throw {
            statusCode: 400,
            message: `Image too small: ${result.width}×${result.height}px. Minimum: ${MIN_RESOLUTION}×${MIN_RESOLUTION}px`,
          };
        }

        const isFirst = existingCount === 0 && i === 0;
        const image = await productRepository.addImage(productId, {
          url: result.secure_url,
          publicId: result.public_id,
          isPrimary: isFirst,
          displayOrder: existingCount + i,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          altText: null,
        });

        createdImages.push(image);
      }

      return createdImages;
    } catch (err) {
      // Rollback: delete any images already created in this batch
      for (const img of createdImages) {
        await productRepository.deleteImage(img.id).catch(() => {});
        if (img.publicId) {
          await cloudinary.uploader.destroy(img.publicId).catch(() => {});
        }
      }
      throw err;
    }
  }

  /**
   * Upload a single remote URL (e.g., Unsplash during seeding).
   */
  async uploadImageUrl(productId, url, isPrimary = false, altText = null) {
    const result = await uploadUrlToCloudinary(url, productId);

    const existingCount = await productRepository.countImages(productId);

    return await productRepository.addImage(productId, {
      url: result.secure_url,
      publicId: result.public_id,
      isPrimary: isPrimary || existingCount === 0,
      displayOrder: existingCount,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      altText,
    });
  }

  /**
   * Delete a product image.
   * Enforces: cannot delete the last image (409).
   * Auto-promotes next image if primary is deleted.
   */
  async deleteImage(productId, imageId) {
    console.log(`[ImageService.deleteImage] productId=${productId} imageId=${imageId}`);

    // 1. Look up the image first — before counting — so we get proper 404 if it doesn't exist
    const image = await productRepository.getImageById(imageId);
    if (!image) {
      console.warn(`[ImageService.deleteImage] Image ${imageId} not found in DB`);
      throw { statusCode: 404, message: `Image not found: ${imageId}` };
    }

    // 2. Verify this image belongs to the specified product
    if (image.productId !== productId) {
      console.warn(`[ImageService.deleteImage] Image ${imageId} belongs to product ${image.productId}, not ${productId}`);
      throw { statusCode: 404, message: 'Image not found for this product' };
    }

    // 3. Count remaining images for this product
    const count = await productRepository.countImages(productId);
    console.log(`[ImageService.deleteImage] Product ${productId} has ${count} image(s)`);

    if (count <= 1) {
      console.warn(`[ImageService.deleteImage] Refusing delete — only ${count} image remaining`);
      throw {
        statusCode: 409,
        message: 'Cannot delete the only remaining image. A product must have at least one image.',
      };
    }

    const wasPrimary = image.isPrimary;
    console.log(`[ImageService.deleteImage] isPrimary=${wasPrimary} publicId=${image.publicId}`);

    // 4. Delete from database first
    await productRepository.deleteImage(imageId);
    console.log(`[ImageService.deleteImage] DB record deleted for imageId=${imageId}`);

    // 5. Delete from Cloudinary (non-blocking — DB is already consistent)
    if (image.publicId) {
      try {
        const cldResult = await cloudinary.uploader.destroy(image.publicId);
        console.log(`[ImageService.deleteImage] Cloudinary destroy result: ${JSON.stringify(cldResult)} for ${image.publicId}`);
      } catch (err) {
        console.error(`[ImageService.deleteImage] Cloudinary delete failed for ${image.publicId}: ${err.message}`);
        // Don't re-throw — DB is already consistent, Cloudinary can be cleaned up separately
      }
    } else {
      console.log(`[ImageService.deleteImage] No publicId — skipping Cloudinary delete`);
    }

    // 6. Auto-promote next image if we deleted the primary
    if (wasPrimary) {
      const remaining = await productRepository.getImagesByProductId(productId);
      if (remaining.length > 0) {
        console.log(`[ImageService.deleteImage] Promoting ${remaining[0].id} as new primary`);
        await productRepository.setPrimaryImage(productId, remaining[0].id);
      }
    }

    console.log(`[ImageService.deleteImage] Done — deleted imageId=${imageId}`);
    return { success: true, deleted: imageId };
  }

  /**
   * Set a specific image as primary.
   */
  async setPrimaryImage(productId, imageId) {
    const image = await productRepository.getImageById(imageId);
    if (!image || image.productId !== productId) {
      throw { statusCode: 404, message: 'Image not found' };
    }

    await productRepository.setPrimaryImage(productId, imageId);
    return await productRepository.getImagesByProductId(productId);
  }

  /**
   * Reorder images. orderedIds = array of image IDs in desired order.
   */
  async reorderImages(productId, orderedIds) {
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw { statusCode: 400, message: 'orderedIds must be a non-empty array' };
    }

    await productRepository.reorderImages(productId, orderedIds);
    return await productRepository.getImagesByProductId(productId);
  }

  /**
   * Get all images for a product.
   */
  async getImages(productId) {
    return await productRepository.getImagesByProductId(productId);
  }
}

export default new ProductImageService();
export { uploadUrlToCloudinary };
