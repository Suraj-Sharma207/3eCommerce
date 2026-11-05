import productImageService from "../services/productImageService.js";
import prisma from "../lib/prisma.js";

// Find a non-primary image belonging to a product with 2+ images
const img = await prisma.productImage.findFirst({
  where: { isPrimary: false },
  include: { product: { include: { images: true } } },
});

if (!img) {
  console.log("No non-primary image found to test with");
  process.exit(0);
}

console.log("─".repeat(60));
console.log(`Testing delete of gallery image`);
console.log(`  imageId:     ${img.id}`);
console.log(`  productId:   ${img.productId}`);
console.log(`  imageCount:  ${img.product.images.length}`);
console.log(`  isPrimary:   ${img.isPrimary}`);
console.log("─".repeat(60));

try {
  const result = await productImageService.deleteImage(img.productId, img.id);
  console.log("\n✅ DELETE SUCCESS:", JSON.stringify(result));

  // Verify DB
  const remaining = await prisma.productImage.findMany({
    where: { productId: img.productId },
  });
  console.log(`✅ Remaining images in DB: ${remaining.length}`);
  console.log(`✅ Primary assigned: ${remaining.some((r) => r.isPrimary)}`);
} catch (err) {
  console.error("\n❌ DELETE FAILED:", err.message || err);
  console.error("Status:", err.statusCode);
} finally {
  await prisma.$disconnect();
}
