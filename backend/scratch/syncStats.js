import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Synchronizing totalSold and totalRevenue from OrderItems...');

  const items = await prisma.orderItem.findMany();
  
  const stats = {};

  for (const item of items) {
    if (!stats[item.productId]) {
      stats[item.productId] = { totalSold: 0, totalRevenue: 0 };
    }
    stats[item.productId].totalSold += item.quantity;
    stats[item.productId].totalRevenue += (item.price * item.quantity);
  }

  let updated = 0;
  for (const [productId, stat] of Object.entries(stats)) {
    await prisma.product.update({
      where: { id: productId },
      data: {
        totalSold: stat.totalSold,
        totalRevenue: stat.totalRevenue,
        lastPurchasedAt: new Date()
      }
    });
    updated++;
  }

  console.log(`Successfully synced stats for ${updated} products.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
