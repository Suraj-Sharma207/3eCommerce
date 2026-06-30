import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.order.findMany({ include: { items: true } }).then(orders => {
  console.log('Total orders:', orders.length);
  const withItems = orders.filter(o => o.items.length > 0).length;
  console.log('Orders with items:', withItems);
  
  const statusCounts = {};
  orders.forEach(o => {
    statusCounts[o.orderStatus] = (statusCounts[o.orderStatus] || 0) + 1;
  });
  console.log('Status counts:', statusCounts);
}).finally(() => prisma.$disconnect());
