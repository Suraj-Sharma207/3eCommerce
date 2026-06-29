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
      
      // Decrement wishlistCount asynchronously
      import('../lib/prisma.js').then(({ default: prisma }) => {
        prisma.product.update({
          where: { id: productId },
          data: { wishlistCount: { decrement: 1 } }
        }).catch(err => console.error(`Failed to decrement wishlistCount for product ${productId}:`, err));
      });
    } else {
      // Add it if it doesn't exist
      await wishlistRepository.addWishlistItem(wishlist.id, productId);
      
      // Increment wishlistCount asynchronously
      import('../lib/prisma.js').then(({ default: prisma }) => {
        prisma.product.update({
          where: { id: productId },
          data: { wishlistCount: { increment: 1 } }
        }).catch(err => console.error(`Failed to increment wishlistCount for product ${productId}:`, err));
      });
    }

    return await wishlistRepository.getWishlistByUserId(userId);
  }
}

export default new WishlistService();
