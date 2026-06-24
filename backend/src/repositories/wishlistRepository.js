import prisma from '../lib/prisma.js';

class WishlistRepository {
  async getWishlistByUserId(userId) {
    return await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }

  async createWishlist(userId) {
    return await prisma.wishlist.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }

  async getWishlistItem(wishlistId, productId) {
    return await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId,
          productId
        }
      }
    });
  }

  async addWishlistItem(wishlistId, productId) {
    return await prisma.wishlistItem.create({
      data: {
        wishlistId,
        productId
      }
    });
  }

  async removeWishlistItem(wishlistItemId) {
    return await prisma.wishlistItem.delete({
      where: { id: wishlistItemId }
    });
  }
}

export default new WishlistRepository();
