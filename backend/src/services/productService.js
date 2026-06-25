import productRepository from '../repositories/productRepository.js';

class ProductService {
  async getProducts({ page = 1, limit = 12, search = '', category, minPrice, maxPrice, inStock, sort, featured, trending, newArrival, bestSeller, sale }) {
    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    const filterArgs = { search, category, minPrice, maxPrice, inStock, sort, featured, trending, newArrival, bestSeller, sale };

    const [products, totalItems] = await Promise.all([
      productRepository.findAll({ skip, take, ...filterArgs }),
      productRepository.count(filterArgs),
    ]);

    const totalPages = Math.ceil(totalItems / take);

    return {
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        itemsPerPage: take,
      },
    };
  }

  async getRelatedProducts(id, limit = 4) {
    return await productRepository.findRelated(id, limit);
  }

  async getProductById(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  async createProduct(data) {
    return await productRepository.create(data);
  }

  async updateProduct(id, data) {
    await this.getProductById(id);
    return await productRepository.update(id, data);
  }

  async deleteProduct(id) {
    await this.getProductById(id);
    return await productRepository.delete(id);
  }

  async getCategories() {
    return await productRepository.getCategories();
  }

  async createStockNotification(productId, email, phone, userId) {
    await this.getProductById(productId); // Ensure product exists
    return await productRepository.createStockNotification(productId, email, phone, userId);
  }
}

export default new ProductService();
