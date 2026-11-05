import prisma from "../lib/prisma.js";
import productService from "../services/productService.js";
import promotionService from "../services/promotionService.js";
import productRepository from "../repositories/productRepository.js";

async function measureShopOperations() {
  console.log("🧪 Diagnosing Shop Page Load Performance...\n");

  try {
    // 1. Measure Categories Fetching
    const startCats = performance.now();
    const categories = await productRepository.getCategories();
    const endCats = performance.now();
    console.log(
      `✓ Categories fetched: ${categories.length} items in ${(endCats - startCats).toFixed(2)}ms`,
    );

    // 2. Measure Active Promotions Fetching
    const startPromos = performance.now();
    const promos = await promotionService.getActivePromotions();
    const endPromos = performance.now();
    console.log(
      `✓ Active Promotions fetched: ${promos.length} items in ${(endPromos - startPromos).toFixed(2)}ms`,
    );

    // 3. Measure Products Listing (Page 1)
    const startProducts = performance.now();
    const productsResult = await productService.getProducts({
      page: 1,
      limit: 15,
    });
    const endProducts = performance.now();
    console.log(
      `✓ Products page 1 fetched: ${productsResult.products.length} items in ${(endProducts - startProducts).toFixed(2)}ms`,
    );

    console.log("\n================ PERFORMANCE DIAGNOSTICS ================");
    console.log(`Categories Query:  ${(endCats - startCats).toFixed(2)} ms`);
    console.log(
      `Promotions Query:  ${(endPromos - startPromos).toFixed(2)} ms`,
    );
    console.log(
      `Products Page 1:   ${(endProducts - startProducts).toFixed(2)} ms`,
    );
    console.log("=========================================================\n");
  } catch (error) {
    console.error("Diagnostics failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

measureShopOperations();
