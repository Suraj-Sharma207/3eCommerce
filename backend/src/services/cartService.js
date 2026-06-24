import cartRepository from '../repositories/cartRepository.js';

class CartService {
  async getCart(userId) {
    let cart = await cartRepository.getCartByUserId(userId);
    if (!cart) {
      cart = await cartRepository.createCart(userId);
    }
    return cart;
  }

  async addToCart(userId, productId, quantity) {
    let cart = await cartRepository.getCartByUserId(userId);
    if (!cart) {
      cart = await cartRepository.createCart(userId);
    }

    const existingItem = await cartRepository.getCartItem(cart.id, productId);

    if (existingItem) {
      await cartRepository.updateCartItem(existingItem.id, existingItem.quantity + quantity);
    } else {
      await cartRepository.addCartItem(cart.id, productId, quantity);
    }

    return await cartRepository.getCartByUserId(userId);
  }

  async updateQuantity(userId, productId, quantity) {
    const cart = await cartRepository.getCartByUserId(userId);
    if (!cart) throw new Error('Cart not found');

    const item = await cartRepository.getCartItem(cart.id, productId);
    if (!item) throw new Error('Item not found in cart');

    if (quantity <= 0) {
      await cartRepository.removeCartItem(item.id);
    } else {
      await cartRepository.updateCartItem(item.id, quantity);
    }

    return await cartRepository.getCartByUserId(userId);
  }

  async removeFromCart(userId, productId) {
    const cart = await cartRepository.getCartByUserId(userId);
    if (!cart) throw new Error('Cart not found');

    const item = await cartRepository.getCartItem(cart.id, productId);
    if (!item) throw new Error('Item not found in cart');

    await cartRepository.removeCartItem(item.id);

    return await cartRepository.getCartByUserId(userId);
  }

  async clearCart(userId) {
    const cart = await cartRepository.getCartByUserId(userId);
    if (cart) {
      await cartRepository.clearCart(cart.id);
    }
    return await cartRepository.getCartByUserId(userId);
  }
}

export default new CartService();
