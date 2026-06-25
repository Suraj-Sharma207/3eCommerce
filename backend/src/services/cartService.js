import cartRepository from '../repositories/cartRepository.js';
import productRepository from '../repositories/productRepository.js';

class CartService {
  async getCart(userId) {
    let cart = await cartRepository.getCartByUserId(userId);
    if (!cart) {
      cart = await cartRepository.createCart(userId);
    }
    return cart;
  }

  async addToCart(userId, productId, quantity) {
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      throw new Error('Invalid quantity');
    }

    const product = await productRepository.findById(productId);
    if (!product) throw new Error('Product not found');

    let cart = await cartRepository.getCartByUserId(userId);
    if (!cart) {
      cart = await cartRepository.createCart(userId);
    }

    const existingItem = await cartRepository.getCartItem(cart.id, productId);
    const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    if (newQuantity > product.stock) {
      throw new Error(`Cannot add more than available stock (${product.stock})`);
    }

    if (existingItem) {
      await cartRepository.updateCartItem(existingItem.id, newQuantity);
    } else {
      await cartRepository.addCartItem(cart.id, productId, quantity);
    }

    return await cartRepository.getCartByUserId(userId);
  }

  async updateQuantity(userId, productId, quantity) {
    if (!Number.isInteger(quantity)) {
      throw new Error('Invalid quantity');
    }

    const cart = await cartRepository.getCartByUserId(userId);
    if (!cart) throw new Error('Cart not found');

    const item = await cartRepository.getCartItem(cart.id, productId);
    if (!item) throw new Error('Item not found in cart');

    if (quantity <= 0) {
      await cartRepository.removeCartItem(item.id);
    } else {
      const product = await productRepository.findById(productId);
      if (!product) throw new Error('Product not found');
      
      if (quantity > product.stock) {
        throw new Error(`Cannot update quantity above available stock (${product.stock})`);
      }
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
