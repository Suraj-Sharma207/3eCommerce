import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findFirst({ where: { name: 'Decorative Round Mirror' } });
  console.log('Product active?', p.active);
  console.log('Total sold?', p.totalSold);
  
  const bestSellers = await prisma.product.findMany({
      where: { active: true, totalSold: { gt: 0 } },
      orderBy: [
        { totalSold: 'desc' },
        { totalRevenue: 'desc' }
      ]
  });
  console.log('Best Sellers length:', bestSellers.length);
  await prisma.$disconnect();
}
main();
