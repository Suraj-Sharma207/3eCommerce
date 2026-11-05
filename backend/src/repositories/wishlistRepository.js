import prisma from "../lib/prisma.js";
import { mapProduct } from "../utils/productMapper.js";

const PRODUCT_WITH_IMAGES = {
  include: {
    images: { orderBy: { displayOrder: "asc" } },
  },
};

const mapOrderItem = (item) => ({
  ...item,
  product: item.product ? mapProduct(item.product) : null,
});

const mapOrder = (order) => {
  if (!order) return null;
  return {
    ...order,
    items: (order.items || []).map(mapOrderItem),
  };
};

class WishlistRepository {
  async getWishlistByUserId(userId) {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: PRODUCT_WITH_IMAGES,
          },
        },
      },
    });
    if (!wishlist) return null;
    return {
      ...wishlist,
      items: wishlist.items.map((item) => ({
        ...item,
        product: mapProduct(item.product),
      })),
    };
  }

  async createWishlist(userId) {
    const wishlist = await prisma.wishlist.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: PRODUCT_WITH_IMAGES,
          },
        },
      },
    });
    return {
      ...wishlist,
      items: wishlist.items.map((item) => ({
        ...item,
        product: mapProduct(item.product),
      })),
    };
  }

  async getWishlistItem(wishlistId, productId) {
    return await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId,
          productId,
        },
      },
    });
  }

  async addWishlistItem(wishlistId, productId) {
    return await prisma.wishlistItem.create({
      data: {
        wishlistId,
        productId,
      },
    });
  }

  async removeWishlistItem(wishlistItemId) {
    return await prisma.wishlistItem.delete({
      where: { id: wishlistItemId },
    });
  }
}

export default new WishlistRepository();
