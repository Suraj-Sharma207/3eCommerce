import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkDatabase() {
  const deliveredOrders = await prisma.order.findMany({
    where: { orderStatus: 'DELIVERED' },
    include: { items: { include: { product: true } } }
  });

  console.log(`Number of DELIVERED orders: ${deliveredOrders.length}`);
  
  let orderItemsCount = 0;
  const uniqueProducts = new Set();
  const uniqueCategories = new Set();

  for (const order of deliveredOrders) {
    orderItemsCount += order.items.length;
    for (const item of order.items) {
      if (item.product) {
        uniqueProducts.add(item.product.id);
        uniqueCategories.add(item.product.category);
      }
    }
  }

  console.log(`Number of delivered OrderItems: ${orderItemsCount}`);
  console.log(`Number of unique sold products: ${uniqueProducts.size}`);
  console.log(`Number of unique sold categories: ${uniqueCategories.size}`);

  await prisma.$disconnect();
}

checkDatabase().catch(console.error);
