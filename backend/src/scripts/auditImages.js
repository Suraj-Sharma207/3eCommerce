/**
 * auditImages.js
 *
 * Run with: npm run audit:images
 *
 * Checks:
 *  1. Products with zero images
 *  2. Products with no primary image
 *  3. Products with multiple primary images
 *  4. Duplicate URL within same product
 *  5. Duplicate publicId across all products
 *  6. Orphaned ProductImage rows (product deleted but image remains)
 *  7. URL reachability (HEAD request test)
 *  8. Missing Cloudinary assets
 */

import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const checkCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

/** Simple HEAD check for URL reachability */
const isUrlReachable = async (url) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { method: "HEAD", signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
};

async function main() {
  console.log("🔍 LuxeHome Image Audit\n");
  console.log("=".repeat(60));

  const issues = [];

  // ── Fetch all products with images ─────────────────────────────────────────
  const products = await prisma.product.findMany({
    include: {
      images: { orderBy: { displayOrder: "asc" } },
    },
  });

  const allImages = await prisma.productImage.findMany();

  // ── Check 1: Products with zero images ─────────────────────────────────────
  console.log("\n1️⃣  Products with zero images:");
  const noImages = products.filter((p) => p.images.length === 0);
  if (noImages.length === 0) {
    console.log("   ✅ All products have at least one image.");
  } else {
    noImages.forEach((p) => {
      const msg = `   ❌ [${p.id}] "${p.name}" (${p.category}) — NO images`;
      console.log(msg);
      issues.push(msg);
    });
  }

  // ── Check 2: Products with no primary image ─────────────────────────────────
  console.log("\n2️⃣  Products with no primary image:");
  const noPrimary = products.filter(
    (p) => p.images.length > 0 && !p.images.some((i) => i.isPrimary),
  );
  if (noPrimary.length === 0) {
    console.log("   ✅ All non-empty products have a primary image.");
  } else {
    noPrimary.forEach((p) => {
      const msg = `   ❌ [${p.id}] "${p.name}" — has ${p.images.length} images but NONE is primary`;
      console.log(msg);
      issues.push(msg);
    });
  }

  // ── Check 3: Products with multiple primary images ──────────────────────────
  console.log("\n3️⃣  Products with multiple primary images:");
  const multiPrimary = products.filter(
    (p) => p.images.filter((i) => i.isPrimary).length > 1,
  );
  if (multiPrimary.length === 0) {
    console.log("   ✅ No products have multiple primary images.");
  } else {
    multiPrimary.forEach((p) => {
      const count = p.images.filter((i) => i.isPrimary).length;
      const msg = `   ❌ [${p.id}] "${p.name}" — ${count} images marked isPrimary=true`;
      console.log(msg);
      issues.push(msg);
    });
  }

  // ── Check 4: Duplicate URLs within same product ─────────────────────────────
  console.log("\n4️⃣  Duplicate image URLs within same product:");
  let dupUrlFound = false;
  products.forEach((p) => {
    const urls = p.images.map((i) => i.url);
    const unique = new Set(urls);
    if (unique.size !== urls.length) {
      dupUrlFound = true;
      const msg = `   ❌ [${p.id}] "${p.name}" — duplicate URLs detected`;
      console.log(msg);
      issues.push(msg);
    }
  });
  if (!dupUrlFound) console.log("   ✅ No duplicate URLs within any product.");

  // ── Check 5: Duplicate publicId across all products ─────────────────────────
  console.log("\n5️⃣  Duplicate publicIds across products:");
  const publicIds = allImages.filter((i) => i.publicId).map((i) => i.publicId);
  const publicIdSet = new Set(publicIds);
  if (publicIdSet.size !== publicIds.length) {
    const counts = {};
    publicIds.forEach((id) => {
      counts[id] = (counts[id] || 0) + 1;
    });
    Object.entries(counts)
      .filter(([, v]) => v > 1)
      .forEach(([id]) => {
        const msg = `   ❌ Duplicate publicId: "${id}"`;
        console.log(msg);
        issues.push(msg);
      });
  } else {
    console.log("   ✅ All publicIds are unique.");
  }

  // ── Check 6: Orphaned images ────────────────────────────────────────────────
  console.log("\n6️⃣  Orphaned ProductImage rows:");
  const productIds = new Set(products.map((p) => p.id));
  const orphaned = allImages.filter((i) => !productIds.has(i.productId));
  if (orphaned.length === 0) {
    console.log("   ✅ No orphaned images found.");
  } else {
    orphaned.forEach((i) => {
      const msg = `   ❌ Orphan image [${i.id}] for missing product ${i.productId}`;
      console.log(msg);
      issues.push(msg);
    });
  }

  // ── Check 7: URL reachability ────────────────────────────────────────────────
  console.log("\n7️⃣  URL reachability check (sample — primary images only):");
  const primaryImages = allImages.filter((i) => i.isPrimary);
  let brokenCount = 0;
  for (const img of primaryImages) {
    const ok = await isUrlReachable(img.url);
    if (!ok) {
      brokenCount++;
      const product = products.find((p) => p.id === img.productId);
      const msg = `   ❌ Broken URL for "${product?.name}": ${img.url.substring(0, 80)}`;
      console.log(msg);
      issues.push(msg);
    }
  }
  if (brokenCount === 0) {
    console.log(
      `   ✅ All ${primaryImages.length} primary image URLs are reachable.`,
    );
  }

  // ── Check 8: Cloudinary asset existence ─────────────────────────────────────
  if (checkCloudinary) {
    console.log("\n8️⃣  Cloudinary asset existence (publicId spot-check):");
    const sampleImages = allImages.filter((i) => i.publicId).slice(0, 20);
    let missingCount = 0;
    for (const img of sampleImages) {
      try {
        await cloudinary.api.resource(img.publicId);
      } catch (err) {
        if (err.http_code === 404) {
          missingCount++;
          const msg = `   ❌ Missing from Cloudinary: ${img.publicId}`;
          console.log(msg);
          issues.push(msg);
        }
      }
    }
    if (missingCount === 0) {
      console.log(
        `   ✅ All ${sampleImages.length} sampled Cloudinary assets exist.`,
      );
    }
  } else {
    console.log(
      "\n8️⃣  Cloudinary check: ⚠️ Skipped (credentials not configured)",
    );
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 AUDIT SUMMARY:`);
  console.log(`   Total Products:      ${products.length}`);
  console.log(`   Total Images:        ${allImages.length}`);
  console.log(
    `   Primary Images:      ${allImages.filter((i) => i.isPrimary).length}`,
  );
  console.log(
    `   Cloudinary Assets:   ${allImages.filter((i) => i.publicId).length}`,
  );
  console.log(`   Issues Found:        ${issues.length}`);

  if (issues.length === 0) {
    console.log("\n✅ All checks passed. Image integrity is perfect.\n");
  } else {
    console.log(`\n❌ ${issues.length} issues found. Please review above.\n`);
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error("Audit failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
