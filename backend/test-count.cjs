const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  console.log('Orders:', await prisma.order.count());
  console.log('Customers:', await prisma.user.count({ where: { role: 'CUSTOMER' } }));
}
test().finally(() => prisma.$disconnect());
