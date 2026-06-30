import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function run() {
  console.log('Starting statistics recalculation...');
  
  // Reset all stats first
  await prisma.product.updateMany({
    data: {
      totalSold: 0,
      totalRevenue: 0,
    }
  });

  console.log('Reset all product statistics to 0. Processing orders...');

  // Get all delivered order items
  const orders = await prisma.order.findMany({
    where: { orderStatus: 'DELIVERED' },
    include: { items: true }
  });

  const productStats = {};

  for (const order of orders) {
    for (const item of order.items) {
      if (!productStats[item.productId]) {
        productStats[item.productId] = {
          totalSold: 0,
          totalRevenue: 0,
          lastPurchasedAt: order.createdAt
        };
      }
      
      productStats[item.productId].totalSold += item.quantity;
      productStats[item.productId].totalRevenue += (item.price * item.quantity);
      
      if (order.createdAt > productStats[item.productId].lastPurchasedAt) {
        productStats[item.productId].lastPurchasedAt = order.createdAt;
      }
    }
  }

  const updates = [];
  for (const [productId, stats] of Object.entries(productStats)) {
    updates.push(
      prisma.product.update({
        where: { id: productId },
        data: {
          totalSold: stats.totalSold,
          totalRevenue: stats.totalRevenue,
          lastPurchasedAt: stats.lastPurchasedAt
        }
      })
    );
  }

  // Execute in batches to avoid overwhelming the database
  const batchSize = 100;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    await Promise.all(batch);
    console.log(`Processed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(updates.length/batchSize)}`);
  }

  console.log('Statistics recalculation complete!');
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
