import cartService from "../services/cartService.js";
import { successResponse } from "../utils/response.js";

class CartController {
  async getCart(req, res, next) {
    try {
      const cart = await cartService.getCart(req.user.id);
      return successResponse(res, "Cart retrieved successfully", cart, 200);
    } catch (error) {
      next(error);
    }
  }

  async addToCart(req, res, next) {
    try {
      const { productId, quantity = 1 } = req.body;
      const cart = await cartService.addToCart(
        req.user.id,
        productId,
        quantity,
      );
      return successResponse(res, "Item added to cart", cart, 200);
    } catch (error) {
      next(error);
    }
  }

  async updateQuantity(req, res, next) {
    try {
      const { productId } = req.params;
      const { quantity } = req.body;
      const cart = await cartService.updateQuantity(
        req.user.id,
        productId,
        quantity,
      );
      return successResponse(res, "Cart updated", cart, 200);
    } catch (error) {
      next(error);
    }
  }

  async removeFromCart(req, res, next) {
    try {
      const { productId } = req.params;
      const cart = await cartService.removeFromCart(req.user.id, productId);
      return successResponse(res, "Item removed from cart", cart, 200);
    } catch (error) {
      next(error);
    }
  }

  async clearCart(req, res, next) {
    try {
      const cart = await cartService.clearCart(req.user.id);
      return successResponse(res, "Cart cleared", cart, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new CartController();
