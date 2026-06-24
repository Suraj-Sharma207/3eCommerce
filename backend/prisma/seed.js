import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log(`Admin created with id: ${admin.id}`);

  const customerPassword = await bcrypt.hash('customer123', 10);

  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      name: 'Test Customer',
      password: customerPassword,
      role: 'CUSTOMER',
    },
  });

  console.log(`Customer created with id: ${customer.id}`);

  console.log('Seeding products...');
  
  const products = [
    {
      name: 'Nordic Lounge Chair',
      description: 'A masterpiece of Scandinavian design, this lounge chair features premium wool blend upholstery and a solid oak frame. Perfect for reading corners or as a statement piece in your living room.',
      price: 499.99,
      category: 'Living Room',
      stock: 15,
      imageUrl: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80'
    },
    {
      name: 'Ceramic Table Vase',
      description: 'Handcrafted ceramic vase with a matte finish. Its minimalist geometric design makes it a beautiful decorative piece with or without flowers.',
      price: 89.50,
      category: 'Decor',
      stock: 42,
      imageUrl: 'https://images.unsplash.com/photo-1613203009765-a8c4ce8c7f96?w=800&q=80'
    },
    {
      name: 'Modern Platform Bed',
      description: 'Sleek, low-profile platform bed upholstered in soft performance fabric. Includes a built-in padded headboard for ultimate comfort.',
      price: 1299.00,
      category: 'Bedroom',
      stock: 8,
      imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80'
    },
    {
      name: 'Brass Floor Lamp',
      description: 'Elegant floor lamp featuring a brushed brass finish and an adjustable arched arm. Provides warm, ambient lighting to any space.',
      price: 245.00,
      category: 'Lighting',
      stock: 20,
      imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80'
    }
  ];

  for (const p of products) {
    await prisma.product.create({
      data: p
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
