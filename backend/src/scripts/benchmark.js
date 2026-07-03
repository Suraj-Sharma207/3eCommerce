import prisma from '../lib/prisma.js';

async function runBenchmark() {
  console.log('⚡ Starting Database Performance Benchmark...\n');

  try {
    // 1. Fetch customers using the OLD N+1 query method
    console.log('[Test 1] Running Old N+1 Query (Sequential wishlist counts)...');
    const startOld = performance.now();
    
    const customersOld = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      take: 20,
      include: {
        orders: { select: { id: true, totalAmount: true } },
        wishlist: { select: { id: true } }
      }
    });

    const populatedOld = await Promise.all(customersOld.map(async (c) => {
      let wishlistCount = 0;
      if (c.wishlist) {
        wishlistCount = await prisma.wishlistItem.count({ where: { wishlistId: c.wishlist.id } });
      }
      const totalSpend = c.orders.reduce((sum, order) => sum + order.totalAmount, 0);
      return {
        ...c,
        totalSpend,
        orderCount: c.orders.length,
        wishlistCount,
        password: undefined
      };
    }));

    const endOld = performance.now();
    const oldTime = endOld - startOld;
    console.log(`✓ Old N+1 Query completed in: ${oldTime.toFixed(2)}ms`);

    // 2. Fetch customers using the NEW optimized query method (Nested Relation Count)
    console.log('\n[Test 2] Running Optimized O(1) Query (Prisma _count inclusion)...');
    const startNew = performance.now();

    const customersNew = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      take: 20,
      include: {
        orders: { select: { id: true, totalAmount: true } },
        wishlist: {
          select: {
            id: true,
            _count: {
              select: { items: true }
            }
          }
        }
      }
    });

    const populatedNew = customersNew.map((c) => {
      const wishlistCount = c.wishlist?._count?.items || 0;
      const totalSpend = c.orders.reduce((sum, order) => sum + order.totalAmount, 0);
      return {
        ...c,
        totalSpend,
        orderCount: c.orders.length,
        wishlistCount,
        password: undefined
      };
    });

    const endNew = performance.now();
    const newTime = endNew - startNew;
    console.log(`✓ Optimized Query completed in: ${newTime.toFixed(2)}ms`);

    // 3. Compare Results
    const speedup = oldTime / newTime;
    const diffTime = oldTime - newTime;
    const pctImprovement = ((oldTime - newTime) / oldTime) * 100;

    console.log('\n================ BENCHMARK RESULTS ================');
    console.log(`Old Style (N+1 Queries):   ${oldTime.toFixed(2)} ms`);
    console.log(`Optimized (Single Query):  ${newTime.toFixed(2)} ms`);
    console.log(`Latency Reduction:         -${diffTime.toFixed(2)} ms`);
    console.log(`Performance Speedup:       ${speedup.toFixed(2)}x Faster`);
    console.log(`Percentage Improvement:    ${pctImprovement.toFixed(2)}%`);
    console.log('===================================================\n');

  } catch (error) {
    console.error('Benchmark failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runBenchmark();
