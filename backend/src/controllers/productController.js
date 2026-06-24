import productService from '../services/productService.js';
import { successResponse, errorResponse } from '../utils/response.js';

class ProductController {
  async getProducts(req, res, next) {
    try {
      const { page, limit, search, category, minPrice, maxPrice, inStock, sort } = req.query;
      const data = await productService.getProducts({ page, limit, search, category, minPrice, maxPrice, inStock, sort });
      return successResponse(res, 'Products retrieved successfully', data, 200);
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      return successResponse(res, 'Product retrieved successfully', { product }, 200);
    } catch (error) {
      if (error.message === 'Product not found') {
        return errorResponse(res, error.message, [], 404);
      }
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const product = await productService.createProduct(req.body);
      return successResponse(res, 'Product created successfully', { product }, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      return successResponse(res, 'Product updated successfully', { product }, 200);
    } catch (error) {
      if (error.message === 'Product not found') {
        return errorResponse(res, error.message, [], 404);
      }
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      await productService.deleteProduct(req.params.id);
      return successResponse(res, 'Product deleted successfully', {}, 200);
    } catch (error) {
      if (error.message === 'Product not found') {
        return errorResponse(res, error.message, [], 404);
      }
      next(error);
    }
  }
}

export default new ProductController();
