import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import adminService from '../src/services/adminService.js';
import fs from 'fs';

const prisma = new PrismaClient();

async function seedOrders() {
  console.log('Seeding fake DELIVERED orders...');
  try {
    // 1. Find a customer
    let user = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: 'Seeding User',
          email: 'seeder@ecommerce.com',
          password: 'Password123!'
        }
      });
    }

    // 2. Get distinct categories and products
    const categories = ['Living Room', 'Bedroom', 'Dining', 'Decor', 'Outdoor', 'Office'];
    const productsToBuy = [];
    
    for (const cat of categories) {
      const p = await prisma.product.findFirst({ where: { category: cat, stock: { gt: 0 } } });
      if (p) productsToBuy.push(p);
    }
    
    // Fallback if not enough categories
    if (productsToBuy.length < 5) {
      const more = await prisma.product.findMany({ take: 5 });
      for (const p of more) {
        if (!productsToBuy.find(x => x.id === p.id)) {
          productsToBuy.push(p);
        }
      }
    }

    // 3. Create orders for each product
    for (let i = 0; i < 5; i++) {
      if (!productsToBuy[i]) continue;
      const product = productsToBuy[i];
      const qty = Math.floor(Math.random() * 3) + 1;
      const totalAmount = qty * product.price;

      await prisma.order.create({
        data: {
          orderNumber: `ORD-SEED-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: user.id,
          totalAmount,
          subtotal: totalAmount,
          taxAmount: 0,
          shippingCharge: 0,
          paymentStatus: 'PAID',
          orderStatus: 'DELIVERED',
          paymentMethod: 'CREDIT_CARD',
          shippingAddress: { label: 'Home' },
          billingAddress: { label: 'Home' },
          items: {
            create: [
              {
                productId: product.id,
                quantity: qty,
                price: product.price
              }
            ]
          }
        }
      });
      console.log(`Created order for ${product.category} - ${product.name}`);
    }
    
    console.log('Orders seeded successfully.');

    // Print the numbers
    const totalDelivered = await prisma.order.count({ where: { orderStatus: 'DELIVERED' } });
    const orderItems = await prisma.orderItem.findMany({ where: { order: { orderStatus: 'DELIVERED' } }, include: { product: true } });
    const uProducts = new Set(orderItems.map(i => i.product.id)).size;
    const uCategories = new Set(orderItems.map(i => i.product.category)).size;

    console.log('\n--- VERIFICATION OUTPUT ---');
    console.log(`1. Number of delivered orders: ${totalDelivered}`);
    console.log(`2. Number of delivered OrderItems: ${orderItems.length}`);
    console.log(`3. Number of unique sold products: ${uProducts}`);
    console.log(`4. Number of unique sold categories: ${uCategories}`);
    
    const analyticsData = await adminService.getRevenueAnalytics();
    console.log('\n5. Raw JSON returned by Revenue Analytics API:');
    console.log(JSON.stringify(analyticsData, null, 2));

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedOrders();
