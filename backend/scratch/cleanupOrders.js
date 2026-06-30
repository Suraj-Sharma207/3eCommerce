import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('--- PHASE 1: FIND CORRUPTED ORDERS ---');
  
  // Find orders with zero items
  const corruptedOrders = await prisma.order.findMany({
    where: {
      items: {
        none: {}
      }
    },
    include: {
      user: true,
      _count: {
        select: { items: true }
      }
    }
  });

  console.log(`Found ${corruptedOrders.length} corrupted orders.`);
  
  if (corruptedOrders.length === 0) {
    console.log('No corrupted orders found. Exiting.');
    return;
  }

  // Print Report
  console.log('\n--- REPORT ---');
  corruptedOrders.forEach(order => {
    console.log(`Order ID: ${order.id}`);
    console.log(`Customer: ${order.user?.name || order.userId}`);
    console.log(`Status: ${order.orderStatus}`);
    console.log(`Created Date: ${order.createdAt}`);
    console.log(`Total Amount: ${order.totalAmount}`);
    console.log(`Item Count: ${order._count.items}`);
    console.log('-----------------------------');
  });

  console.log('\n--- PHASE 2: BACKUP ---');
  const backupPath = path.join(process.cwd(), 'scratch', 'corrupted_orders_backup.json');
  fs.mkdirSync(path.join(process.cwd(), 'scratch'), { recursive: true });
  fs.writeFileSync(backupPath, JSON.stringify(corruptedOrders, null, 2));
  console.log(`Backup successfully created at: ${backupPath}`);

  console.log('\n--- PHASE 3: CLEANUP ---');
  const orderIds = corruptedOrders.map(o => o.id);
  
  try {
    const deleteResult = await prisma.$transaction(async (tx) => {
      return await tx.order.deleteMany({
        where: {
          id: { in: orderIds },
          items: { none: {} }
        }
      });
    });
    
    console.log(`Successfully deleted ${deleteResult.count} corrupted orders.`);
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
