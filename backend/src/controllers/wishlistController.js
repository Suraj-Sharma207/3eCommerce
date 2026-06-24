import wishlistService from '../services/wishlistService.js';
import { successResponse } from '../utils/response.js';

class WishlistController {
  async getWishlist(req, res, next) {
    try {
      const wishlist = await wishlistService.getWishlist(req.user.id);
      return successResponse(res, 'Wishlist retrieved successfully', wishlist, 200);
    } catch (error) {
      next(error);
    }
  }

  async toggleWishlistItem(req, res, next) {
    try {
      const { productId } = req.body;
      const wishlist = await wishlistService.toggleWishlistItem(req.user.id, productId);
      return successResponse(res, 'Wishlist updated', wishlist, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new WishlistController();
