import prisma from '../lib/prisma.js';

class CartRepository {
  async getCartByUserId(userId) {
    return await prisma.cart.findUnique({
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

  async createCart(userId) {
    return await prisma.cart.create({
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

  async getCartItem(cartId, productId) {
    return await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId,
          productId
        }
      }
    });
  }

  async addCartItem(cartId, productId, quantity) {
    return await prisma.cartItem.create({
      data: {
        cartId,
        productId,
        quantity
      }
    });
  }

  async updateCartItem(cartItemId, quantity) {
    return await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity }
    });
  }

  async removeCartItem(cartItemId) {
    return await prisma.cartItem.delete({
      where: { id: cartItemId }
    });
  }

  async clearCart(cartId) {
    return await prisma.cartItem.deleteMany({
      where: { cartId }
    });
  }
}

export default new CartRepository();
