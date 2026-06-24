import prisma from '../lib/prisma.js';

class UserRepository {
  async findByEmail(email) {
    return await prisma.user.findUnique({ where: { email } });
  }

  async findById(id) {
    return await prisma.user.findUnique({ where: { id } });
  }

  async create(userData) {
    return await prisma.user.create({ data: userData });
  }
}

export default new UserRepository();
