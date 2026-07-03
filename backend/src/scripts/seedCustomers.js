import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { hashPassword } from '../utils/bcrypt.js';

const prisma = new PrismaClient();

// Data Pools
const INDIAN_FIRST_NAMES = ['Rahul', 'Priya', 'Aman', 'Neha', 'Arjun', 'Sneha', 'Rohit', 'Pooja', 'Aditya', 'Anjali', 'Karan', 'Kavita', 'Vikram', 'Meera', 'Sanjay', 'Divya', 'Rohan', 'Swati', 'Vishal', 'Riya', 'Amit', 'Shreya', 'Manish', 'Nidhi', 'Rajesh', 'Preeti', 'Suresh', 'Anita', 'Vinod', 'Geeta', 'Anand', 'Sunita', 'Dinesh', 'Kiran', 'Nitin', 'Rekha', 'Deepak', 'Seema', 'Ajay', 'Aarti', 'Vikas', 'Jyoti'];
const INDIAN_LAST_NAMES = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Yadav', 'Kumar', 'Mishra', 'Reddy', 'Das', 'Iyer', 'Nair', 'Joshi', 'Pandey', 'Rao', 'Jain', 'Agarwal', 'Desai', 'Shah', 'Malhotra', 'Bhat', 'Bose', 'Chakraborty', 'Chauhan', 'Choudhury', 'Dubey', 'Ghosh', 'Kapoor', 'Kaur', 'Kulkarni', 'Mehta', 'Mukherjee', 'Pillai', 'Rajput', 'Sengupta', 'Thakur', 'Tiwari'];
const WESTERN_FIRST_NAMES = ['John', 'Emily', 'Michael', 'Sarah', 'David', 'Jessica', 'James', 'Ashley', 'Robert', 'Amanda', 'William', 'Jennifer', 'Joseph', 'Melissa', 'Charles', 'Stephanie', 'Thomas', 'Nicole', 'Christopher', 'Elizabeth'];
const WESTERN_LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

const INDIAN_CITIES = [
  { city: 'Delhi', state: 'Delhi', pinPrefix: '110' },
  { city: 'Mumbai', state: 'Maharashtra', pinPrefix: '400' },
  { city: 'Bengaluru', state: 'Karnataka', pinPrefix: '560' },
  { city: 'Pune', state: 'Maharashtra', pinPrefix: '411' },
  { city: 'Hyderabad', state: 'Telangana', pinPrefix: '500' },
  { city: 'Chennai', state: 'Tamil Nadu', pinPrefix: '600' },
  { city: 'Jaipur', state: 'Rajasthan', pinPrefix: '302' },
  { city: 'Ahmedabad', state: 'Gujarat', pinPrefix: '380' },
  { city: 'Lucknow', state: 'Uttar Pradesh', pinPrefix: '226' },
  { city: 'Chandigarh', state: 'Chandigarh', pinPrefix: '160' },
  { city: 'Kolkata', state: 'West Bengal', pinPrefix: '700' },
  { city: 'Surat', state: 'Gujarat', pinPrefix: '395' },
  { city: 'Kanpur', state: 'Uttar Pradesh', pinPrefix: '208' },
  { city: 'Nagpur', state: 'Maharashtra', pinPrefix: '440' },
  { city: 'Indore', state: 'Madhya Pradesh', pinPrefix: '452' },
];

const STREET_NAMES = ['Main Street', 'MG Road', 'Station Road', 'Market Road', 'Temple Road', 'Link Road', 'Ring Road', 'Church Street', 'High Street', 'Park Avenue', 'Gandhi Marg', 'Bypass Road', 'Hospital Road', 'College Road', 'Fort Road'];
const AREAS = ['Phase 1', 'Phase 2', 'Sector 15', 'Sector 22', 'Civil Lines', 'Vasant Vihar', 'Defense Colony', 'Indira Nagar', 'Rajendra Nagar', 'Jubilee Hills', 'Banjara Hills', 'Salt Lake', 'Koramangala', 'Indiranagar', 'Andheri West', 'Bandra East'];
const LANDMARKS = ['Near Apollo Hospital', 'Opposite City Mall', 'Behind Central Park', 'Next to SBI Bank', 'Above Star Market', 'Near Railway Station', 'Opposite Metro Station', 'Beside Post Office'];
const ORDER_STATUSES = ['DELIVERED', 'PROCESSING', 'SHIPPED', 'PENDING', 'CANCELLED'];

// Helpers
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomElements = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const randomPhone = () => `+919${Math.random().toString().slice(2, 11)}`;

async function seed() {
  console.log('🌱 Starting Enterprise Customer Seed Generation...');

  // 1. Idempotency Check (We allow appending, but warn)
  const existingCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
  if (existingCustomers > 500) {
    console.log(`⚠️  Found ${existingCustomers} existing customers. Appending 1050 more...`);
  }

  // 2. Fetch Products
  const products = await prisma.product.findMany({ select: { id: true, price: true, finalPrice: true } });
  if (products.length === 0) {
    console.error('❌ No products found in the database. Please run the main seed script first.');
    process.exit(1);
  }
  console.log(`📦 Loaded ${products.length} products for orders and carts.`);

  // 3. Hash Password Once
  console.log('🔑 Hashing common password...');
  const commonPasswordHash = await hashPassword('Customer@123');

  // Arrays to hold generated records
  const usersToInsert = [];
  const addressesToInsert = [];
  const ordersToInsert = [];
  const orderItemsToInsert = [];
  const cartsToInsert = [];
  const cartItemsToInsert = [];
  const wishlistsToInsert = [];
  const wishlistItemsToInsert = [];

  const TOTAL_CUSTOMERS = 1050;
  const ONE_YEAR_AGO = new Date();
  ONE_YEAR_AGO.setFullYear(ONE_YEAR_AGO.getFullYear() - 1);
  const NOW = new Date();

  console.log(`🧑 Generating ${TOTAL_CUSTOMERS} customers and relationships...`);

  const usedEmails = new Set(); // Ensure email uniqueness

  for (let i = 0; i < TOTAL_CUSTOMERS; i++) {
    // Determine name
    const isIndian = Math.random() < 0.85; // 85% Indian
    const firstName = randomElement(isIndian ? INDIAN_FIRST_NAMES : WESTERN_FIRST_NAMES);
    const lastName = randomElement(isIndian ? INDIAN_LAST_NAMES : WESTERN_LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    
    // Unique Email
    let emailBase = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    let email = `${emailBase}${randomInt(1, 9999)}@example.com`;
    while (usedEmails.has(email)) {
      email = `${emailBase}${randomInt(10000, 99999)}@example.com`;
    }
    usedEmails.add(email);

    const userId = crypto.randomUUID();
    const createdAt = randomDate(ONE_YEAR_AGO, NOW);
    
    // User Record
    usersToInsert.push({
      id: userId,
      name: fullName,
      email: email,
      password: commonPasswordHash,
      role: 'CUSTOMER',
      phone: randomPhone(),
      isEmailVerified: true,
      active: true,
      createdAt: createdAt,
      updatedAt: createdAt,
      passwordUpdatedAt: createdAt,
      language: 'en',
      currency: 'INR'
    });

    // Address Generation (~75% of users)
    const location = randomElement(INDIAN_CITIES);
    const hasAddress = Math.random() < 0.75;
    if (hasAddress) {
      const addressCount = randomInt(1, 3);
      for (let a = 0; a < addressCount; a++) {
        addressesToInsert.push({
          id: crypto.randomUUID(),
          userId: userId,
          recipientName: fullName,
          phoneNumber: randomPhone(),
          label: a === 0 ? 'Home' : (a === 1 ? 'Office' : 'Other'),
          street: `${randomInt(1, 999)}, ${randomElement(STREET_NAMES)}`,
          addressLine2: randomElement(AREAS),
          landmark: Math.random() > 0.5 ? randomElement(LANDMARKS) : null,
          city: location.city,
          state: location.state,
          zipCode: `${location.pinPrefix}${randomInt(100, 999)}`,
          country: 'India',
          isDefaultShipping: a === 0,
          isDefaultBilling: a === 0,
          createdAt: createdAt,
          updatedAt: createdAt
        });
      }
    }

    // Orders Generation (~40% of users)
    const hasOrders = Math.random() < 0.40;
    if (hasOrders) {
      const orderCount = randomInt(1, 8);
      for (let o = 0; o < orderCount; o++) {
        const orderId = crypto.randomUUID();
        const orderDate = randomDate(createdAt, NOW);
        
        // Pick random products for this order
        const numItems = randomInt(1, 6);
        const selectedProducts = randomElements(products, numItems);
        
        let subtotal = 0;
        let discountAmount = 0;

        selectedProducts.forEach(product => {
          const qty = randomInt(1, 3);
          const price = product.price;
          const finalPrice = product.finalPrice;
          
          subtotal += price * qty;
          discountAmount += (price - finalPrice) * qty;

          orderItemsToInsert.push({
            id: crypto.randomUUID(),
            orderId: orderId,
            productId: product.id,
            quantity: qty,
            price: finalPrice
          });
        });

        const taxAmount = (subtotal - discountAmount) * 0.18; // 18% tax
        const shippingCharge = subtotal > 1000 ? 0 : 50; // Free shipping over 1000
        const totalAmount = subtotal - discountAmount + taxAmount + shippingCharge;

        // Determine Order Status using weighted distribution
        // 55% Delivered, 20% Processing, 10% Shipped, 10% Pending, 5% Cancelled
        const statusRoll = Math.random();
        let status = 'DELIVERED';
        if (statusRoll > 0.55 && statusRoll <= 0.75) status = 'PROCESSING';
        else if (statusRoll > 0.75 && statusRoll <= 0.85) status = 'SHIPPED';
        else if (statusRoll > 0.85 && statusRoll <= 0.95) status = 'PENDING';
        else if (statusRoll > 0.95) status = 'CANCELLED';

        ordersToInsert.push({
          id: orderId,
          orderNumber: `ORD-${Date.now().toString().slice(-6)}-${crypto.randomUUID().split('-')[0].toUpperCase()}`,
          userId: userId,
          totalAmount: Math.round(totalAmount),
          subtotal: Math.round(subtotal),
          discountAmount: Math.round(discountAmount),
          taxAmount: Math.round(taxAmount),
          shippingCharge,
          deliveryMethod: 'standard',
          paymentStatus: status === 'CANCELLED' ? 'FAILED' : 'PAID',
          orderStatus: status,
          paymentMethod: 'Credit Card',
          transactionRef: `TXN-${crypto.randomUUID().split('-')[0].toUpperCase()}`,
          createdAt: orderDate,
          updatedAt: orderDate,
        });
      }
    }

    // Cart Generation (~20% of users)
    const hasCart = Math.random() < 0.20;
    if (hasCart) {
      const cartId = crypto.randomUUID();
      cartsToInsert.push({
        id: cartId,
        userId: userId,
        createdAt: NOW,
        updatedAt: NOW
      });

      const numCartItems = randomInt(1, 8);
      const cartProducts = randomElements(products, numCartItems);
      cartProducts.forEach(product => {
        cartItemsToInsert.push({
          id: crypto.randomUUID(),
          cartId: cartId,
          productId: product.id,
          quantity: randomInt(1, 3)
        });
      });
    }

    // Wishlist Generation (~40% of users)
    const hasWishlist = Math.random() < 0.40;
    if (hasWishlist) {
      const wishlistId = crypto.randomUUID();
      wishlistsToInsert.push({
        id: wishlistId,
        userId: userId,
        createdAt: createdAt,
        updatedAt: createdAt
      });

      const numWishlistItems = randomInt(2, 15);
      const wishlistProducts = randomElements(products, numWishlistItems);
      wishlistProducts.forEach(product => {
        wishlistItemsToInsert.push({
          id: crypto.randomUUID(),
          wishlistId: wishlistId,
          productId: product.id
        });
      });
    }
  }

  // 4. Batch Insertion Phase
  console.log('🚀 Initiating massive batch insertions...');
  console.log(`- Inserting ${usersToInsert.length} Users...`);
  
  try {
    // Run all insertions sequentially to respect foreign key constraints
    
    // 1. Users
    await prisma.user.createMany({ data: usersToInsert });
    console.log(`✅ Users inserted.`);

    // 2. Addresses
    console.log(`- Inserting ${addressesToInsert.length} Addresses...`);
    await prisma.address.createMany({ data: addressesToInsert });
    console.log(`✅ Addresses inserted.`);

    // 3. Orders
    console.log(`- Inserting ${ordersToInsert.length} Orders...`);
    await prisma.order.createMany({ data: ordersToInsert });
    console.log(`✅ Orders inserted.`);

    // 4. Order Items
    console.log(`- Inserting ${orderItemsToInsert.length} Order Items...`);
    const chunkSize = 5000;
    for (let i = 0; i < orderItemsToInsert.length; i += chunkSize) {
      const chunk = orderItemsToInsert.slice(i, i + chunkSize);
      await prisma.orderItem.createMany({ data: chunk });
    }
    console.log(`✅ Order Items inserted.`);

    // 5. Carts
    console.log(`- Inserting ${cartsToInsert.length} Carts...`);
    await prisma.cart.createMany({ data: cartsToInsert });
    
    console.log(`- Inserting ${cartItemsToInsert.length} Cart Items...`);
    await prisma.cartItem.createMany({ data: cartItemsToInsert });
    console.log(`✅ Carts & Items inserted.`);

    // 6. Wishlists
    console.log(`- Inserting ${wishlistsToInsert.length} Wishlists...`);
    await prisma.wishlist.createMany({ data: wishlistsToInsert });
    
    console.log(`- Inserting ${wishlistItemsToInsert.length} Wishlist Items...`);
    for (let i = 0; i < wishlistItemsToInsert.length; i += chunkSize) {
      const chunk = wishlistItemsToInsert.slice(i, i + chunkSize);
      await prisma.wishlistItem.createMany({ data: chunk });
    }
    console.log(`✅ Wishlists & Items inserted.`);

    console.log('🎉 Enterprise Data Seeding Completed Successfully!');
    console.log(`
      Metrics:
      - Customers: ${usersToInsert.length}
      - Addresses: ${addressesToInsert.length}
      - Orders: ${ordersToInsert.length}
      - Order Items: ${orderItemsToInsert.length}
      - Carts: ${cartsToInsert.length}
      - Wishlists: ${wishlistsToInsert.length}
    `);

  } catch (error) {
    console.error('❌ Error during batch insertion:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
