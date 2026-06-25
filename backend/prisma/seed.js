import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateProducts = () => {
  const products = [];
  
  const generateId = () => Math.random().toString(36).substring(2, 10);
  
  const images = [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&q=80&w=1000'
  ];

  let skuCounter = 1000;

  const createProduct = (category, name, price, discount, rating, reviews, stock, tags) => {
    skuCounter++;
    const finalPrice = discount > 0 ? price - (price * (discount / 100)) : price;
    const isOutOfStock = stock === 0;
    return {
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + skuCounter,
      brand: ['IKEA', 'Ashley', 'West Elm', 'CB2', 'Pottery Barn'][Math.floor(Math.random() * 5)],
      sku: `FURN-${category.substring(0, 3).toUpperCase()}-${skuCounter}`,
      description: `Premium ${name.toLowerCase()} for your ${category.toLowerCase()}. Made with high-quality materials to ensure durability and style. Perfect addition to your modern home.`,
      price,
      discountPercentage: discount,
      finalPrice: Number(finalPrice.toFixed(2)),
      category,
      stock: isOutOfStock ? 0 : stock,
      rating,
      reviewCount: reviews,
      thumbnail: images[Math.floor(Math.random() * images.length)],
      galleryImages: images.slice(0, 3),
      featured: tags.includes('featured'),
      trending: tags.includes('trending'),
      bestSeller: tags.includes('bestSeller'),
      newArrival: tags.includes('newArrival'),
      active: true
    };
  };

  // Living Room (10)
  products.push(createProduct('Living Room', 'Modern Fabric Sofa', 45999, 10, 4.8, 129, 15, ['featured', 'bestSeller']));
  products.push(createProduct('Living Room', 'Luxury Leather Sofa', 89999, 0, 4.9, 58, 5, ['featured', 'trending']));
  products.push(createProduct('Living Room', 'Minimalist Coffee Table', 12999, 15, 4.5, 230, 0, ['trending', 'sale'])); // Out of stock
  products.push(createProduct('Living Room', 'Wooden TV Unit', 24999, 5, 4.7, 85, 12, ['bestSeller']));
  products.push(createProduct('Living Room', 'Glass Side Table', 5499, 0, 4.2, 45, 20, []));
  products.push(createProduct('Living Room', 'Velvet Lounge Chair', 18999, 20, 4.6, 112, 8, ['newArrival', 'trending']));
  products.push(createProduct('Living Room', 'Tall Bookshelf', 15999, 0, 4.8, 300, 25, ['bestSeller']));
  products.push(createProduct('Living Room', 'Marble Console Table', 32999, 10, 4.4, 34, 0, [])); // Out of stock
  products.push(createProduct('Living Room', 'Storage Ottoman', 8999, 0, 4.3, 56, 30, ['newArrival']));
  products.push(createProduct('Living Room', 'Leather Recliner', 38999, 25, 4.9, 410, 10, ['featured']));

  // Bedroom (10)
  products.push(createProduct('Bedroom', 'King Size Upholstered Bed', 54999, 15, 4.7, 150, 8, ['featured', 'bestSeller']));
  products.push(createProduct('Bedroom', 'Queen Wooden Bed', 42999, 0, 4.6, 95, 12, ['trending']));
  products.push(createProduct('Bedroom', 'Modern Nightstand', 6999, 10, 4.5, 120, 0, ['sale'])); // Out of stock
  products.push(createProduct('Bedroom', '3-Door Wardrobe', 35999, 5, 4.4, 80, 5, []));
  products.push(createProduct('Bedroom', 'Mirrored Dressing Table', 21999, 0, 4.8, 200, 15, ['bestSeller']));
  products.push(createProduct('Bedroom', 'Chest of Drawers', 18999, 20, 4.3, 45, 10, ['trending']));
  products.push(createProduct('Bedroom', 'Velvet Storage Bench', 12999, 0, 4.6, 60, 22, ['newArrival']));
  products.push(createProduct('Bedroom', 'Brass Bedside Lamp', 2999, 0, 4.2, 35, 40, []));
  products.push(createProduct('Bedroom', 'Memory Foam Mattress', 25999, 30, 4.9, 500, 0, ['featured', 'bestSeller'])); // Out of stock
  products.push(createProduct('Bedroom', 'Mirror Cabinet', 14999, 10, 4.5, 75, 18, ['newArrival']));

  // Dining (8)
  products.push(createProduct('Dining', 'Solid Wood Dining Table', 45999, 0, 4.8, 110, 6, ['featured']));
  products.push(createProduct('Dining', 'Upholstered Dining Chair', 8999, 15, 4.6, 250, 40, ['bestSeller', 'trending']));
  products.push(createProduct('Dining', 'Metal Bar Stool', 4999, 0, 4.4, 85, 30, []));
  products.push(createProduct('Dining', 'Vintage Sideboard', 32999, 20, 4.7, 95, 0, ['sale'])); // Out of stock
  products.push(createProduct('Dining', 'Glass Crockery Cabinet', 28999, 0, 4.5, 40, 8, ['newArrival']));
  products.push(createProduct('Dining', 'Marble Buffet Table', 55999, 10, 4.9, 30, 4, ['featured']));
  products.push(createProduct('Dining', 'Wooden Dining Bench', 12999, 0, 4.3, 55, 15, []));
  products.push(createProduct('Dining', 'Wine Cabinet', 19999, 5, 4.6, 70, 12, ['trending']));

  // Office (8)
  products.push(createProduct('Office', 'Ergonomic Office Desk', 18999, 15, 4.7, 320, 25, ['bestSeller', 'featured']));
  products.push(createProduct('Office', 'Leather Executive Chair', 22999, 0, 4.8, 450, 15, ['trending']));
  products.push(createProduct('Office', 'Ladder Bookshelf', 9999, 10, 4.5, 180, 20, []));
  products.push(createProduct('Office', 'Metal Filing Cabinet', 12999, 0, 4.2, 90, 30, ['newArrival']));
  products.push(createProduct('Office', 'Round Meeting Table', 25999, 20, 4.6, 65, 5, ['sale']));
  products.push(createProduct('Office', 'Compact Laptop Desk', 8999, 0, 4.4, 110, 0, [])); // Out of stock
  products.push(createProduct('Office', 'Adjustable Standing Desk', 35999, 10, 4.9, 210, 12, ['featured', 'trending']));
  products.push(createProduct('Office', 'Rolling Storage Unit', 6999, 0, 4.3, 85, 18, []));

  // Outdoor (7)
  products.push(createProduct('Outdoor', 'Wicker Patio Chair', 12999, 20, 4.5, 140, 30, ['trending']));
  products.push(createProduct('Outdoor', 'Teak Garden Table', 28999, 0, 4.7, 95, 10, ['featured']));
  products.push(createProduct('Outdoor', 'Sectional Outdoor Sofa', 65999, 15, 4.8, 120, 5, ['bestSeller']));
  products.push(createProduct('Outdoor', 'Cotton Hammock', 4999, 0, 4.6, 200, 45, []));
  products.push(createProduct('Outdoor', 'Hanging Swing Chair', 18999, 10, 4.9, 310, 0, ['newArrival', 'trending'])); // Out of stock
  products.push(createProduct('Outdoor', 'Large Patio Umbrella', 8999, 0, 4.4, 75, 20, []));
  products.push(createProduct('Outdoor', 'Gas Fire Pit Table', 42999, 25, 4.8, 85, 8, ['featured', 'sale']));

  // Decor (7)
  products.push(createProduct('Decor', 'Oversized Wall Clock', 5999, 0, 4.5, 220, 25, ['bestSeller']));
  products.push(createProduct('Decor', 'Arc Floor Lamp', 12999, 10, 4.7, 180, 15, ['trending']));
  products.push(createProduct('Decor', 'Tiered Indoor Plant Stand', 4499, 0, 4.6, 150, 40, ['newArrival']));
  products.push(createProduct('Decor', 'Persian Area Rug', 18999, 30, 4.8, 290, 10, ['featured', 'sale']));
  products.push(createProduct('Decor', 'Ceramic Floor Vase', 3999, 0, 4.3, 65, 0, [])); // Out of stock
  products.push(createProduct('Decor', 'Floating Wall Shelf', 2499, 0, 4.4, 310, 50, ['bestSeller']));
  products.push(createProduct('Decor', 'Decorative Round Mirror', 8999, 15, 4.7, 140, 20, ['trending']));

  return products;
};

async function main() {
  console.log('Seeding products...');
  
  // Wipe existing
  await prisma.product.deleteMany({});
  
  const products = generateProducts();

  for (const p of products) {
    await prisma.product.create({
      data: p
    });
  }

  console.log(`✅ Seeded ${products.length} products!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
