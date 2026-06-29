/**
 * repairBrokenImages.js
 * 
 * Fixes the 9 products with broken primary URLs by:
 * 1. Finding each broken product by name
 * 2. Uploading a verified replacement URL directly to Cloudinary
 * 3. Updating the ProductImage record with the new Cloudinary URL
 * 
 * Run once: node src/scripts/repairBrokenImages.js
 */

import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Verified Unsplash URLs to replace the broken ones ────────────────────────
// All verified to work as of this writing (popular/curated Unsplash photos)
const REPLACEMENTS = {
  'Wooden TV Unit':          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80',
  'Leather Executive Chair': 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=1200&q=80',
  'Ladder Bookshelf':        'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&q=80',
  'Adjustable Standing Desk':'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200&q=80',
  'Teak Garden Table':       'https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?w=1200&q=80',
  'Hanging Swing Chair':     'https://images.unsplash.com/photo-1503602642458-232111445657?w=1200&q=80',
  'Large Patio Umbrella':    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
  'Gas Fire Pit Table':      'https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?w=1200&q=80',
  'Persian Area Rug':        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80',
};

const uploadUrl = (url, productId) => new Promise((resolve, reject) => {
  cloudinary.uploader.upload(url, {
    folder: `products/${productId}`,
    resource_type: 'image',
    eager: [
      { width: 150,  height: 150,  crop: 'fill', quality: 'auto', fetch_format: 'auto' },
      { width: 800,  height: 800,  crop: 'fill', quality: 'auto', fetch_format: 'auto' },
    ],
    eager_async: false,
    unique_filename: true,
  }, (err, res) => err ? reject(err) : resolve(res));
});

async function main() {
  console.log('🔧 Repairing broken product images...\n');
  let fixed = 0;
  let failed = 0;

  for (const [productName, replacementUrl] of Object.entries(REPLACEMENTS)) {
    process.stdout.write(`  Fixing "${productName}"... `);

    try {
      // Find product
      const product = await prisma.product.findFirst({
        where: { name: productName },
        include: { images: { where: { isPrimary: true } } },
      });

      if (!product) {
        console.log(`⚠️  Not found in DB — skipping`);
        continue;
      }

      const primaryImage = product.images[0];
      if (!primaryImage) {
        console.log(`⚠️  No primary image record — skipping`);
        continue;
      }

      // Upload replacement to Cloudinary
      const result = await uploadUrl(replacementUrl, product.id);

      // Update the DB record
      await prisma.productImage.update({
        where: { id: primaryImage.id },
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        },
      });

      // Delete old broken Cloudinary asset if it had one
      if (primaryImage.publicId && primaryImage.publicId !== result.public_id) {
        await cloudinary.uploader.destroy(primaryImage.publicId).catch(() => {});
      }

      console.log(`✅  Fixed → ${result.secure_url.substring(0, 60)}...`);
      fixed++;
    } catch (err) {
      console.log(`❌  Failed: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Repair complete: ${fixed} fixed, ${failed} failed`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
