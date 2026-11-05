import prisma from "../lib/prisma.js";
import { mapProduct } from "../utils/productMapper.js";

const PRODUCT_WITH_IMAGES = {
  include: {
    images: { orderBy: { displayOrder: "asc" } },
  },
};

/** Map product inside a cart item */
const mapCartItem = (item) => ({
  ...item,
  product: item.product ? mapProduct(item.product) : null,
});

/** Map all items in a cart */
const mapCart = (cart) => {
  if (!cart) return null;
  return {
    ...cart,
    items: (cart.items || []).map(mapCartItem),
  };
};

class CartRepository {
  async getCartByUserId(userId) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: PRODUCT_WITH_IMAGES,
          },
        },
      },
    });
    return mapCart(cart);
  }

  async createCart(userId) {
    const cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: PRODUCT_WITH_IMAGES,
          },
        },
      },
    });
    return mapCart(cart);
  }

  async getCartItem(cartId, productId) {
    return await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId,
          productId,
        },
      },
    });
  }

  async addCartItem(cartId, productId, quantity) {
    return await prisma.cartItem.create({
      data: {
        cartId,
        productId,
        quantity,
      },
    });
  }

  async updateCartItem(cartItemId, quantity) {
    return await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });
  }

  async removeCartItem(cartItemId) {
    return await prisma.cartItem.delete({
      where: { id: cartItemId },
    });
  }

  async clearCart(cartId) {
    return await prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }
}

export default new CartRepository();
