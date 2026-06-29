import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.product.findMany({
    select: { category: true },
    distinct: ['category']
  });
  console.log(categories);
}

main().catch(console.error).finally(() => prisma.$disconnect());
