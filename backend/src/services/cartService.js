import cartRepository from "../repositories/cartRepository.js";
import productRepository from "../repositories/productRepository.js";
import promotionService from "./promotionService.js";

class CartService {
  async getCart(userId) {
    let cart = await cartRepository.getCartByUserId(userId);
    if (!cart) {
      cart = await cartRepository.createCart(userId);
    }
    return await this._processCartPromotions(cart);
  }

  async addToCart(userId, productId, quantity) {
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      throw new Error("Invalid quantity");
    }

    const product = await productRepository.findById(productId);
    if (!product) throw new Error("Product not found");

    let cart = await cartRepository.getCartByUserId(userId);
    if (!cart) {
      cart = await cartRepository.createCart(userId);
    }

    const existingItem = await cartRepository.getCartItem(cart.id, productId);
    const newQuantity = existingItem
      ? existingItem.quantity + quantity
      : quantity;

    if (newQuantity > product.stock) {
      throw new Error(
        `Cannot add more than available stock (${product.stock})`,
      );
    }

    if (existingItem) {
      await cartRepository.updateCartItem(existingItem.id, newQuantity);
    } else {
      await cartRepository.addCartItem(cart.id, productId, quantity);
      import("../lib/prisma.js").then(({ default: prisma }) => {
        prisma.product
          .update({
            where: { id: productId },
            data: { cartCount: { increment: 1 } },
          })
          .catch((err) =>
            console.error(
              `Failed to increment cartCount for product ${productId}:`,
              err,
            ),
          );
      });
    }

    const updatedCart = await cartRepository.getCartByUserId(userId);
    return await this._processCartPromotions(updatedCart);
  }

  async updateQuantity(userId, productId, quantity) {
    if (!Number.isInteger(quantity)) {
      throw new Error("Invalid quantity");
    }

    const cart = await cartRepository.getCartByUserId(userId);
    if (!cart) throw new Error("Cart not found");

    const item = await cartRepository.getCartItem(cart.id, productId);
    if (!item) throw new Error("Item not found in cart");

    if (quantity <= 0) {
      await cartRepository.removeCartItem(item.id);
      import("../lib/prisma.js").then(({ default: prisma }) => {
        // L-2 FIX: Guard against negative cartCount
        prisma.product
          .updateMany({
            where: { id: productId, cartCount: { gt: 0 } },
            data: { cartCount: { decrement: 1 } },
          })
          .catch((err) =>
            console.error(
              `Failed to decrement cartCount for product ${productId}:`,
              err,
            ),
          );
      });
    } else {
      const product = await productRepository.findById(productId);
      if (!product) throw new Error("Product not found");

      if (quantity > product.stock) {
        throw new Error(
          `Cannot update quantity above available stock (${product.stock})`,
        );
      }
      await cartRepository.updateCartItem(item.id, quantity);
    }

    const updatedCart = await cartRepository.getCartByUserId(userId);
    return await this._processCartPromotions(updatedCart);
  }

  async removeFromCart(userId, productId) {
    const cart = await cartRepository.getCartByUserId(userId);
    if (!cart) throw new Error("Cart not found");

    const item = await cartRepository.getCartItem(cart.id, productId);
    if (!item) throw new Error("Item not found in cart");

    await cartRepository.removeCartItem(item.id);

    import("../lib/prisma.js").then(({ default: prisma }) => {
      // L-2 FIX: Guard against negative cartCount
      prisma.product
        .updateMany({
          where: { id: productId, cartCount: { gt: 0 } },
          data: { cartCount: { decrement: 1 } },
        })
        .catch((err) =>
          console.error(
            `Failed to decrement cartCount for product ${productId}:`,
            err,
          ),
        );
    });

    const updatedCart = await cartRepository.getCartByUserId(userId);
    return await this._processCartPromotions(updatedCart);
  }

  async clearCart(userId) {
    const cart = await cartRepository.getCartByUserId(userId);
    if (cart) {
      const items = cart.items || [];
      await cartRepository.clearCart(cart.id);
      if (items.length > 0) {
        import("../lib/prisma.js").then(({ default: prisma }) => {
          // L-2 FIX: Guard against negative cartCount
          Promise.all(
            items.map((item) =>
              prisma.product
                .updateMany({
                  where: { id: item.productId, cartCount: { gt: 0 } },
                  data: { cartCount: { decrement: 1 } },
                })
                .catch(() => {}),
            ),
          );
        });
      }
    }
    const updatedCart = await cartRepository.getCartByUserId(userId);
    return await this._processCartPromotions(updatedCart);
  }
  async _processCartPromotions(cart) {
    if (!cart || !cart.items) return cart;
    const activePromotions = await promotionService.getActivePromotions();
    let subtotal = 0;

    cart.items = await Promise.all(
      cart.items.map(async (item) => {
        const { finalPrice, discountPercentage } =
          await promotionService.calculateProductPrice(
            item.product,
            activePromotions,
          );
        item.product.finalPrice = finalPrice;
        item.product.discountPercentage = discountPercentage;
        item.totalPrice = finalPrice * item.quantity;
        subtotal += item.totalPrice;
        return item;
      }),
    );

    cart.subtotal = subtotal;
    return cart;
  }
}

export default new CartService();
