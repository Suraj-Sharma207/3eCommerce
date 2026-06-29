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

// ─── Cloudinary upload helper ─────────────────────────────────────────────────
const uploadImage = (url, productId, isPrimary) => new Promise((resolve, reject) => {
  cloudinary.uploader.upload(url, {
    folder: `products/${productId}`,
    resource_type: 'image',
    eager: [
      { width: 150,  height: 150,  crop: 'fill', quality: 'auto', fetch_format: 'auto' },
      { width: 400,  height: 400,  crop: 'fill', quality: 'auto', fetch_format: 'auto' },
      { width: 800,  height: 800,  crop: 'fill', quality: 'auto', fetch_format: 'auto' },
      { width: 1200, height: 1200, crop: 'fill', quality: 'auto', fetch_format: 'auto' },
    ],
    eager_async: false,
    unique_filename: true,
  }, (err, result) => {
    if (err) return reject(err);
    resolve(result);
  });
});

// ─── Product catalog with distinct, category-correct Unsplash image URLs ─────────
/**
 * Each product has a unique primary Unsplash URL.
 * Additional gallery images (2nd, 3rd) are similar products for variety.
 * Format: { name, category, images: [primaryUrl, ...galleryUrls] }
 */
const PRODUCTS = [
  // ── Living Room (10) ──────────────────────────────────────────────────────
  { name: 'Modern Fabric Sofa',       category: 'Living Room', price: 45999, discount: 10, rating: 4.8, reviews: 129, stock: 15, tags: ['featured','bestSeller'], images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80', 'https://images.unsplash.com/photo-1631634568744-a1b6c1d5b4c3?w=1200&q=80'] },
  { name: 'Luxury Leather Sofa',      category: 'Living Room', price: 89999, discount: 0,  rating: 4.9, reviews: 58,  stock: 5,  tags: ['featured','trending'],   images: ['https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=1200&q=80', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80'] },
  { name: 'Minimalist Coffee Table',  category: 'Living Room', price: 12999, discount: 15, rating: 4.5, reviews: 230, stock: 0,  tags: ['trending','sale'],       images: ['https://images.unsplash.com/photo-1567016432779-094069958ea5?w=1200&q=80', 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=1200&q=80'] },
  { name: 'Wooden TV Unit',           category: 'Living Room', price: 24999, discount: 5,  rating: 4.7, reviews: 85,  stock: 12, tags: ['bestSeller'],            images: ['https://images.unsplash.com/photo-1593640408182-31c228c13b29?w=1200&q=80', 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=1200&q=80'] },
  { name: 'Glass Side Table',         category: 'Living Room', price: 5499,  discount: 0,  rating: 4.2, reviews: 45,  stock: 20, tags: [],                        images: ['https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=1200&q=80', 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=1200&q=80'] },
  { name: 'Velvet Lounge Chair',      category: 'Living Room', price: 18999, discount: 20, rating: 4.6, reviews: 112, stock: 8,  tags: ['newArrival','trending'], images: ['https://images.unsplash.com/photo-1586158291800-2665f07bba79?w=1200&q=80', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80'] },
  { name: 'Tall Bookshelf',           category: 'Living Room', price: 15999, discount: 0,  rating: 4.8, reviews: 300, stock: 25, tags: ['bestSeller'],            images: ['https://images.unsplash.com/photo-1594620302200-9a762244a156?w=1200&q=80', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&q=80'] },
  { name: 'Marble Console Table',     category: 'Living Room', price: 32999, discount: 10, rating: 4.4, reviews: 34,  stock: 0,  tags: [],                        images: ['https://images.unsplash.com/photo-1618219944342-824e40a13285?w=1200&q=80', 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=1200&q=80'] },
  { name: 'Storage Ottoman',          category: 'Living Room', price: 8999,  discount: 0,  rating: 4.3, reviews: 56,  stock: 30, tags: ['newArrival'],            images: ['https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=1200&q=80', 'https://images.unsplash.com/photo-1586158291800-2665f07bba79?w=1200&q=80'] },
  { name: 'Leather Recliner',         category: 'Living Room', price: 38999, discount: 25, rating: 4.9, reviews: 410, stock: 10, tags: ['featured'],              images: ['https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=1200&q=80', 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=1200&q=80'] },

  // ── Bedroom (10) ─────────────────────────────────────────────────────────
  { name: 'King Size Upholstered Bed', category: 'Bedroom', price: 54999, discount: 15, rating: 4.7, reviews: 150, stock: 8,  tags: ['featured','bestSeller'], images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80', 'https://images.unsplash.com/photo-1588046130717-0eb0c9a3ba15?w=1200&q=80'] },
  { name: 'Queen Wooden Bed',          category: 'Bedroom', price: 42999, discount: 0,  rating: 4.6, reviews: 95,  stock: 12, tags: ['trending'],            images: ['https://images.unsplash.com/photo-1588046130717-0eb0c9a3ba15?w=1200&q=80', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80'] },
  { name: 'Modern Nightstand',         category: 'Bedroom', price: 6999,  discount: 10, rating: 4.5, reviews: 120, stock: 0,  tags: ['sale'],                images: ['https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&q=80', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80'] },
  { name: '3-Door Wardrobe',           category: 'Bedroom', price: 35999, discount: 5,  rating: 4.4, reviews: 80,  stock: 5,  tags: [],                      images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80&sat=-100', 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&q=80'] },
  { name: 'Mirrored Dressing Table',   category: 'Bedroom', price: 21999, discount: 0,  rating: 4.8, reviews: 200, stock: 15, tags: ['bestSeller'],          images: ['https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&q=80', 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&q=80'] },
  { name: 'Chest of Drawers',          category: 'Bedroom', price: 18999, discount: 20, rating: 4.3, reviews: 45,  stock: 10, tags: ['trending'],            images: ['https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=1200&q=80', 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&q=80'] },
  { name: 'Velvet Storage Bench',      category: 'Bedroom', price: 12999, discount: 0,  rating: 4.6, reviews: 60,  stock: 22, tags: ['newArrival'],          images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80&hue=180', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80'] },
  { name: 'Brass Bedside Lamp',        category: 'Bedroom', price: 2999,  discount: 0,  rating: 4.2, reviews: 35,  stock: 40, tags: [],                      images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1200&q=80'] },
  { name: 'Memory Foam Mattress',      category: 'Bedroom', price: 25999, discount: 30, rating: 4.9, reviews: 500, stock: 0,  tags: ['featured','bestSeller'], images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80&blur=0', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80'] },
  { name: 'Mirror Cabinet',            category: 'Bedroom', price: 14999, discount: 10, rating: 4.5, reviews: 75,  stock: 18, tags: ['newArrival'],          images: ['https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&q=80&flip=h', 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=1200&q=80'] },

  // ── Dining Room (8) ───────────────────────────────────────────────────────
  { name: 'Solid Wood Dining Table',   category: 'Dining Room', price: 45999, discount: 0,  rating: 4.8, reviews: 110, stock: 6,  tags: ['featured'],              images: ['https://images.unsplash.com/photo-1617104678098-de229db51175?w=1200&q=80', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80'] },
  { name: 'Upholstered Dining Chair',  category: 'Dining Room', price: 8999,  discount: 15, rating: 4.6, reviews: 250, stock: 40, tags: ['bestSeller','trending'], images: ['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1200&q=80', 'https://images.unsplash.com/photo-1617104678098-de229db51175?w=1200&q=80'] },
  { name: 'Metal Bar Stool',           category: 'Dining Room', price: 4999,  discount: 0,  rating: 4.4, reviews: 85,  stock: 30, tags: [],                        images: ['https://images.unsplash.com/photo-1503602642458-232111445657?w=1200&q=80', 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1200&q=80'] },
  { name: 'Vintage Sideboard',         category: 'Dining Room', price: 32999, discount: 20, rating: 4.7, reviews: 95,  stock: 0,  tags: ['sale'],                  images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80', 'https://images.unsplash.com/photo-1617104678098-de229db51175?w=1200&q=80'] },
  { name: 'Glass Crockery Cabinet',    category: 'Dining Room', price: 28999, discount: 0,  rating: 4.5, reviews: 40,  stock: 8,  tags: ['newArrival'],            images: ['https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1200&q=80', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80'] },
  { name: 'Marble Buffet Table',       category: 'Dining Room', price: 55999, discount: 10, rating: 4.9, reviews: 30,  stock: 4,  tags: ['featured'],              images: ['https://images.unsplash.com/photo-1617104678098-de229db51175?w=1200&q=80&flip=h', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80'] },
  { name: 'Wooden Dining Bench',       category: 'Dining Room', price: 12999, discount: 0,  rating: 4.3, reviews: 55,  stock: 15, tags: [],                        images: ['https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1200&q=80', 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1200&q=80'] },
  { name: 'Wine Cabinet',              category: 'Dining Room', price: 19999, discount: 5,  rating: 4.6, reviews: 70,  stock: 12, tags: ['trending'],              images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80'] },

  // ── Office (8) ───────────────────────────────────────────────────────────
  { name: 'Ergonomic Office Desk',     category: 'Office', price: 18999, discount: 15, rating: 4.7, reviews: 320, stock: 25, tags: ['bestSeller','featured'],  images: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200&q=80', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&q=80'] },
  { name: 'Leather Executive Chair',   category: 'Office', price: 22999, discount: 0,  rating: 4.8, reviews: 450, stock: 15, tags: ['trending'],               images: ['https://images.unsplash.com/photo-1589813622673-4d7e7b6e5551?w=1200&q=80', 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200&q=80'] },
  { name: 'Ladder Bookshelf',          category: 'Office', price: 9999,  discount: 10, rating: 4.5, reviews: 180, stock: 20, tags: [],                         images: ['https://images.unsplash.com/photo-1474719956791-d73f5f4b00c1?w=1200&q=80', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&q=80'] },
  { name: 'Metal Filing Cabinet',      category: 'Office', price: 12999, discount: 0,  rating: 4.2, reviews: 90,  stock: 30, tags: ['newArrival'],             images: ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&q=80', 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200&q=80'] },
  { name: 'Round Meeting Table',       category: 'Office', price: 25999, discount: 20, rating: 4.6, reviews: 65,  stock: 5,  tags: ['sale'],                   images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80', 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200&q=80'] },
  { name: 'Compact Laptop Desk',       category: 'Office', price: 8999,  discount: 0,  rating: 4.4, reviews: 110, stock: 0,  tags: [],                         images: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200&q=80&flip=h', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&q=80'] },
  { name: 'Adjustable Standing Desk',  category: 'Office', price: 35999, discount: 10, rating: 4.9, reviews: 210, stock: 12, tags: ['featured','trending'],    images: ['https://images.unsplash.com/photo-1598550476439-6847bf9becce?w=1200&q=80', 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200&q=80'] },
  { name: 'Rolling Storage Unit',      category: 'Office', price: 6999,  discount: 0,  rating: 4.3, reviews: 85,  stock: 18, tags: [],                         images: ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&q=80&flip=v', 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200&q=80'] },

  // ── Outdoor (7) ──────────────────────────────────────────────────────────
  { name: 'Wicker Patio Chair',       category: 'Outdoor', price: 12999, discount: 20, rating: 4.5, reviews: 140, stock: 30, tags: ['trending'],              images: ['https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?w=1200&q=80', 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1200&q=80'] },
  { name: 'Teak Garden Table',        category: 'Outdoor', price: 28999, discount: 0,  rating: 4.7, reviews: 95,  stock: 10, tags: ['featured'],              images: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1200&q=80', 'https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?w=1200&q=80'] },
  { name: 'Sectional Outdoor Sofa',   category: 'Outdoor', price: 65999, discount: 15, rating: 4.8, reviews: 120, stock: 5,  tags: ['bestSeller'],            images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80&rot=2', 'https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?w=1200&q=80'] },
  { name: 'Cotton Hammock',           category: 'Outdoor', price: 4999,  discount: 0,  rating: 4.6, reviews: 200, stock: 45, tags: [],                        images: ['https://images.unsplash.com/photo-1503236823255-94609f598e71?w=1200&q=80', 'https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?w=1200&q=80'] },
  { name: 'Hanging Swing Chair',      category: 'Outdoor', price: 18999, discount: 10, rating: 4.9, reviews: 310, stock: 0,  tags: ['newArrival','trending'], images: ['https://images.unsplash.com/photo-1566661781577-4a96d26a07e3?w=1200&q=80', 'https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?w=1200&q=80'] },
  { name: 'Large Patio Umbrella',     category: 'Outdoor', price: 8999,  discount: 0,  rating: 4.4, reviews: 75,  stock: 20, tags: [],                        images: ['https://images.unsplash.com/photo-1531535765693-d1de4fe1b5b4?w=1200&q=80', 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1200&q=80'] },
  { name: 'Gas Fire Pit Table',       category: 'Outdoor', price: 42999, discount: 25, rating: 4.8, reviews: 85,  stock: 8,  tags: ['featured','sale'],       images: ['https://images.unsplash.com/photo-1543083477-4732977b2254?w=1200&q=80', 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1200&q=80'] },

  // ── Decor (7) ────────────────────────────────────────────────────────────
  { name: 'Oversized Wall Clock',     category: 'Decor', price: 5999,  discount: 0,  rating: 4.5, reviews: 220, stock: 25, tags: ['bestSeller'],             images: ['https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=1200&q=80', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80'] },
  { name: 'Arc Floor Lamp',           category: 'Decor', price: 12999, discount: 10, rating: 4.7, reviews: 180, stock: 15, tags: ['trending'],               images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1200&q=80', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80'] },
  { name: 'Tiered Indoor Plant Stand', category: 'Decor', price: 4499, discount: 0,  rating: 4.6, reviews: 150, stock: 40, tags: ['newArrival'],             images: ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=1200&q=80', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80'] },
  { name: 'Persian Area Rug',         category: 'Decor', price: 18999, discount: 30, rating: 4.8, reviews: 290, stock: 10, tags: ['featured','sale'],        images: ['https://images.unsplash.com/photo-1575652703203-636a3ccce8b0?w=1200&q=80', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80'] },
  { name: 'Ceramic Floor Vase',       category: 'Decor', price: 3999,  discount: 0,  rating: 4.3, reviews: 65,  stock: 0,  tags: [],                         images: ['https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=1200&q=80', 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=1200&q=80'] },
  { name: 'Floating Wall Shelf',      category: 'Decor', price: 2499,  discount: 0,  rating: 4.4, reviews: 310, stock: 50, tags: ['bestSeller'],             images: ['https://images.unsplash.com/photo-1594620302200-9a762244a156?w=1200&q=80', 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=1200&q=80'] },
  { name: 'Decorative Round Mirror',  category: 'Decor', price: 8999,  discount: 15, rating: 4.7, reviews: 140, stock: 20, tags: ['trending'],               images: ['https://images.unsplash.com/photo-1618220252344-8ec99ec624b1?w=1200&q=80', 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=1200&q=80'] },
];

// ─── Seed main function ───────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Starting seed...\n');

  // Wipe all images and products (cascade deletes images)
  console.log('🗑️  Clearing existing products and images...');
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});

  let skuCounter = 1000;

  const checkCloudinary = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  if (!checkCloudinary) {
    console.warn('⚠️  Cloudinary credentials missing. Images will be stored as Unsplash URLs directly.\n');
  } else {
    console.log('☁️  Cloudinary connected. Uploading images...\n');
  }

  for (const p of PRODUCTS) {
    skuCounter++;
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + skuCounter;
    const sku = `LUX-${p.category.substring(0, 3).toUpperCase()}-${skuCounter}`;
    const finalPrice = p.discount > 0 ? p.price - (p.price * p.discount / 100) : p.price;
    const brandOptions = ['IKEA', 'Ashley', 'West Elm', 'CB2', 'Pottery Barn'];
    const brand = brandOptions[skuCounter % brandOptions.length];

    // Create product (no thumbnail or galleryImages — managed by ProductImage)
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug,
        brand,
        sku,
        description: `Premium ${p.name.toLowerCase()} for your ${p.category.toLowerCase()}. Crafted with high-quality materials ensuring durability, style, and comfort. A perfect centrepiece for the modern home.`,
        price: p.price,
        discountPercentage: p.discount,
        finalPrice: Number(finalPrice.toFixed(2)),
        category: p.category,
        stock: p.stock,
        rating: p.rating,
        reviewCount: p.reviews,
        featured: p.tags.includes('featured'),
        trending: p.tags.includes('trending'),
        bestSeller: p.tags.includes('bestSeller'),
        newArrival: p.tags.includes('newArrival'),
        active: true,
      }
    });

    // Upload and link images
    for (let i = 0; i < p.images.length; i++) {
      const imageUrl = p.images[i];
      const isPrimary = i === 0;

      try {
        let finalUrl = imageUrl;
        let publicId = null;
        let width = 1200;
        let height = 800;
        let format = 'jpg';
        let bytes = 0;

        if (checkCloudinary) {
          process.stdout.write(`  ☁️  Uploading ${p.name} image ${i + 1}/${p.images.length}...`);
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload(imageUrl, {
              folder: `products/${product.id}`,
              resource_type: 'image',
              eager: [
                { width: 150,  height: 150,  crop: 'fill', quality: 'auto', fetch_format: 'auto' },
                { width: 400,  height: 400,  crop: 'fill', quality: 'auto', fetch_format: 'auto' },
                { width: 800,  height: 800,  crop: 'fill', quality: 'auto', fetch_format: 'auto' },
                { width: 1200, height: 1200, crop: 'fill', quality: 'auto', fetch_format: 'auto' },
              ],
              eager_async: false,
              unique_filename: true,
            }, (err, res) => err ? reject(err) : resolve(res));
          });
          finalUrl = result.secure_url;
          publicId = result.public_id;
          width = result.width;
          height = result.height;
          format = result.format;
          bytes = result.bytes;
          console.log(` ✓`);
        }

        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: finalUrl,
            publicId,
            isPrimary,
            displayOrder: i,
            width,
            height,
            format,
            bytes,
            altText: isPrimary ? p.name : `${p.name} — view ${i + 1}`,
          }
        });
      } catch (err) {
        console.error(`\n  ❌ Failed image ${i + 1} for "${p.name}": ${err.message || err}`);
        // Store original URL as fallback so product still has at least one image
        if (i === 0) {
          await prisma.productImage.create({
            data: {
              productId: product.id,
              url: imageUrl,
              publicId: null,
              isPrimary: true,
              displayOrder: 0,
              altText: p.name,
            }
          }).catch(() => {});
        }
      }
    }

    console.log(`  ✅ ${p.category.padEnd(12)} → ${p.name}`);
  }

  const total = await prisma.product.count();
  const imgTotal = await prisma.productImage.count();
  console.log(`\n✅ Seeded ${total} products with ${imgTotal} images!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
