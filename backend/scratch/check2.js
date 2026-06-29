import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const items = await prisma.orderItem.findMany({ include: { product: true } });
  console.log('Order items total:', items.length);
  const mirror = items.filter(i => i.product.name === 'Decorative Round Mirror');
  console.log('Mirror items:', mirror.length, 'Quantity:', mirror.reduce((sum, item) => sum + item.quantity, 0));
  await prisma.$disconnect();
}
main();
