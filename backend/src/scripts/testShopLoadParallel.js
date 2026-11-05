import prisma from "../lib/prisma.js";
import productRepository from "../repositories/productRepository.js";
import promotionService from "../services/promotionService.js";

async function testParallel() {
  console.log("🧪 Running Parallel Concurrency Test...");
  try {
    const start = performance.now();

    const page = 1;
    const take = 15;
    const skip = (page - 1) * take;
    const filterArgs = { isAdmin: false };

    const [
      filteredItems,
      totalItems,
      products,
      inventoryCounts,
      activePromotions,
    ] = await Promise.all([
      productRepository.count(filterArgs),
      productRepository.count({ isAdmin: false }),
      productRepository.findAll({ skip, take, ...filterArgs }),
      Promise.resolve(null),
      promotionService.getActivePromotions(),
    ]);

    const end = performance.now();
    console.log(
      `✓ All parallel database calls resolved in: ${(end - start).toFixed(2)}ms`,
    );
    console.log(`- Filtered Items: ${filteredItems}`);
    console.log(`- Total Items: ${totalItems}`);
    console.log(`- Products fetched: ${products.length}`);
    console.log(`- Active Promotions: ${activePromotions.length}`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testParallel();
