const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function audit() {
  try {
    const ordersCount = await prisma.order.count();
    const orderItemsCount = await prisma.orderItem.count();
    const productsCount = await prisma.product.count();

    const deliveredOrders = await prisma.order.count({ where: { orderStatus: 'DELIVERED' } });
    const confirmedOrders = await prisma.order.count({ where: { orderStatus: 'CONFIRMED' } });
    const pendingOrders = await prisma.order.count({ where: { orderStatus: 'PENDING' } });
    

    console.log('--- COUNTS ---');
    console.log('Orders:', ordersCount);
    console.log('OrderItems:', orderItemsCount);
    console.log('Products:', productsCount);
    console.log('DELIVERED Orders:', deliveredOrders);
    console.log('CONFIRMED Orders:', confirmedOrders);
    console.log('PENDING Orders:', pendingOrders);
    console.log('COMPLETED Orders:', completedOrders);

    console.log('\n--- DISTINCT ORDER STATUS ---');
    const distinctStatuses = await prisma.order.groupBy({
      by: ['orderStatus'],
      _count: true
    });
    console.log(distinctStatuses);

    console.log('\n--- DISTINCT PAYMENT STATUS ---');
    const distinctPayment = await prisma.order.groupBy({
      by: ['paymentStatus'],
      _count: true
    });
    console.log(distinctPayment);

    console.log('\n--- SAMPLE ORDER ITEMS ---');
    const sampleItems = await prisma.orderItem.findMany({
      take: 2,
      include: { product: true }
    });
    console.log(JSON.stringify(sampleItems, null, 2));

    console.log('\n--- REPOSITORY DATA FETCH TEST ---');
    const deliveredItemsRaw = await prisma.orderItem.findMany({
        where: { order: { orderStatus: 'DELIVERED' } },
        include: { product: { select: { name: true, category: true } } }
    });
    console.log('Raw delivered items fetched:', deliveredItemsRaw.length);
    if (deliveredItemsRaw.length > 0) {
        console.log('First raw item:', JSON.stringify(deliveredItemsRaw[0], null, 2));
    } else {
        // fetch items from other statuses
        const otherItemsRaw = await prisma.orderItem.findMany({
            take: 1,
            include: { order: { select: { orderStatus: true, paymentStatus: true } } }
        });
        console.log('Sample item with order status:', JSON.stringify(otherItemsRaw[0], null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

audit();
