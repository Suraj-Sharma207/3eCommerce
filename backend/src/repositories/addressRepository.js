import prisma from "../lib/prisma.js";

class AddressRepository {
  async findByUserId(userId) {
    return await prisma.address.findMany({ where: { userId } });
  }

  async findById(id) {
    return await prisma.address.findUnique({ where: { id } });
  }

  async create(data) {
    return await prisma.address.create({ data });
  }

  async update(id, data) {
    return await prisma.address.update({
      where: { id },
      data,
    });
  }

  async delete(id) {
    return await prisma.address.delete({
      where: { id },
    });
  }
}

export default new AddressRepository();
