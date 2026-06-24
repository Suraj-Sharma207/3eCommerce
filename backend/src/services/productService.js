import productRepository from '../repositories/productRepository.js';

class ProductService {
  async getProducts({ page = 1, limit = 12, search = '', category, minPrice, maxPrice, inStock, sort }) {
    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    const [products, totalItems] = await Promise.all([
      productRepository.findAll({ skip, take, search, category, minPrice, maxPrice, inStock, sort }),
      productRepository.count({ search, category, minPrice, maxPrice, inStock }),
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
    // Check if exists
    await this.getProductById(id);
    return await productRepository.update(id, data);
  }

  async deleteProduct(id) {
    // Check if exists
    await this.getProductById(id);
    return await productRepository.delete(id);
  }
}

export default new ProductService();
