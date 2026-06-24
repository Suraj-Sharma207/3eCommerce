import wishlistRepository from '../repositories/wishlistRepository.js';

class WishlistService {
  async getWishlist(userId) {
    let wishlist = await wishlistRepository.getWishlistByUserId(userId);
    if (!wishlist) {
      wishlist = await wishlistRepository.createWishlist(userId);
    }
    return wishlist;
  }

  async toggleWishlistItem(userId, productId) {
    let wishlist = await wishlistRepository.getWishlistByUserId(userId);
    if (!wishlist) {
      wishlist = await wishlistRepository.createWishlist(userId);
    }

    const existingItem = await wishlistRepository.getWishlistItem(wishlist.id, productId);

    if (existingItem) {
      // Remove it if it exists
      await wishlistRepository.removeWishlistItem(existingItem.id);
    } else {
      // Add it if it doesn't exist
      await wishlistRepository.addWishlistItem(wishlist.id, productId);
    }

    return await wishlistRepository.getWishlistByUserId(userId);
  }
}

export default new WishlistService();
