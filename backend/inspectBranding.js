import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const branding = await prisma.brandingSettings.findMany();
  console.log('Branding Settings in DB:', branding);

  const products = await prisma.product.findMany({
    take: 5,
    select: {
      id: true,
      name: true,
      thumbnail: true
    }
  });
  console.log('Sample Products in DB:', products);
}

main().catch(console.error).finally(() => prisma.$disconnect());
