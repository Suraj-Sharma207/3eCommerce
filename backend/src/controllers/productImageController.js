import productImageService from "../services/productImageService.js";
import { successResponse, errorResponse } from "../utils/response.js";

class ProductImageController {
  /**
   * POST /api/products/:id/images
   * Upload one or more images for a product.
   */
  async uploadImages(req, res, next) {
    try {
      const { id: productId } = req.params;

      if (!req.files || req.files.length === 0) {
        return errorResponse(res, "No image files provided", [], 400);
      }

      const images = await productImageService.uploadImages(
        productId,
        req.files,
      );
      return successResponse(
        res,
        "Images uploaded successfully",
        { images },
        201,
      );
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, [], error.statusCode);
      }
      console.error("[ProductImageController.uploadImages]", error);
      next(error);
    }
  }

  /**
   * DELETE /api/products/:id/images/:imageId
   * Delete a product image (enforces minimum 1 image rule).
   */
  async deleteImage(req, res, next) {
    try {
      const { id: productId, imageId } = req.params;
      console.log(
        `[ImageController.deleteImage] DELETE productId=${productId} imageId=${imageId}`,
      );

      if (!productId || !imageId) {
        return errorResponse(
          res,
          "productId and imageId are required",
          [],
          400,
        );
      }

      const result = await productImageService.deleteImage(productId, imageId);
      return successResponse(res, "Image deleted successfully", result, 200);
    } catch (error) {
      const code = error.statusCode;
      if (code === 404) return errorResponse(res, error.message, [], 404);
      if (code === 409) return errorResponse(res, error.message, [], 409);
      if (code === 400) return errorResponse(res, error.message, [], 400);
      console.error("[ImageController.deleteImage] Unexpected error:", error);
      next(error);
    }
  }

  /**
   * PUT /api/products/:id/images/:imageId/primary
   * Set an image as the primary (featured) image.
   */
  async setPrimaryImage(req, res, next) {
    try {
      const { id: productId, imageId } = req.params;
      const images = await productImageService.setPrimaryImage(
        productId,
        imageId,
      );
      return successResponse(res, "Primary image updated", { images }, 200);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, [], error.statusCode);
      }
      next(error);
    }
  }

  /**
   * PUT /api/products/:id/images/reorder
   * Reorder images. Body: { orderedIds: ['id1', 'id2', ...] }
   */
  async reorderImages(req, res, next) {
    try {
      const { id: productId } = req.params;
      const { orderedIds } = req.body;

      if (!Array.isArray(orderedIds)) {
        return errorResponse(
          res,
          "orderedIds must be an array of image IDs",
          [],
          400,
        );
      }

      const images = await productImageService.reorderImages(
        productId,
        orderedIds,
      );
      return successResponse(
        res,
        "Images reordered successfully",
        { images },
        200,
      );
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, [], error.statusCode);
      }
      next(error);
    }
  }

  /**
   * GET /api/products/:id/images
   * Get all images for a product.
   */
  async getImages(req, res, next) {
    try {
      const { id: productId } = req.params;
      const images = await productImageService.getImages(productId);
      return successResponse(
        res,
        "Images retrieved successfully",
        { images },
        200,
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductImageController();
