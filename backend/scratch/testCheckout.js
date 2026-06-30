import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import adminService from '../src/services/adminService.js';

const BASE_URL = 'http://localhost:5000/api';
const prisma = new PrismaClient();

async function e2eCheckout() {
  console.log('--- E2E CHECKOUT TEST STARTED ---');
  try {
    // 1. Get an active product
    console.log('Fetching active product via DB...');
    const product = await prisma.product.findFirst({
      where: { stock: { gt: 0 }, active: true }
    });
    
    if (!product) {
      throw new Error('No in-stock products found to test checkout.');
    }
    console.log(`Selected Product: ${product.name} (ID: ${product.id}, Price: ${product.price})`);

    // 2. Register/Login a customer
    const email = `testuser_${Date.now()}@test.com`;
    const password = 'Password123!';
    console.log(`Registering new customer: ${email}...`);
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'E2E Test User', email, password })
    });
    
    if (!registerRes.ok) {
      const err = await registerRes.text();
      throw new Error(`Registration failed: ${err}`);
    }
    const customerData = await registerRes.json();
    const customerToken = customerData.data ? customerData.data.token : customerData.token;
    console.log('Customer registered successfully. Token obtained.');

    // 3. Add address
    console.log('Adding shipping address...');
    const addressRes = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        recipientName: 'Test User',
        phoneNumber: '9876543210',
        label: 'Home',
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        zipCode: '12345',
        isDefaultShipping: true,
        isDefaultBilling: true
      })
    });
    const addressData = await addressRes.json();
    const addressId = addressData.data?.address?.id || addressData.address?.id || addressData.id;
    console.log(`Address added (ID: ${addressId}).`);

    // 4. Add product to cart
    console.log('Adding product to cart...');
    const cartRes = await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        productId: product.id,
        quantity: 2
      })
    });
    if (!cartRes.ok) throw new Error('Failed to add to cart');
    console.log('Product added to cart.');

    // 5. Checkout
    console.log('Executing checkout...');
    const checkoutRes = await fetch(`${BASE_URL}/orders/checkout`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        shippingAddressId: addressId,
        billingAddressId: addressId,
        paymentMethod: 'CREDIT_CARD',
        paymentDetails: {
          nameOnCard: 'Test User',
          cardNumber: '4242424242424242',
          expiry: '12/28',
          cvc: '123'
        }
      })
    });
    if (!checkoutRes.ok) {
      const err = await checkoutRes.text();
      throw new Error(`Checkout failed: ${err}`);
    }
    const orderResponse = await checkoutRes.json();
    const orderData = orderResponse.data || orderResponse;
    console.log(`Checkout successful! Order created: ${orderData.orderNumber} (ID: ${orderData.id})`);
    
    // Verify OrderItems exist in response
    if (orderData.items && orderData.items.length > 0) {
      console.log(`SUCCESS: Order created with ${orderData.items.length} OrderItems!`);
    } else {
      console.error(`FAILURE: Order created with 0 OrderItems!`);
    }

    // 6. Mark order as DELIVERED via Prisma
    console.log(`Marking order ${orderData.id} as DELIVERED...`);
    await prisma.order.update({
      where: { id: orderData.id },
      data: { orderStatus: 'DELIVERED', paymentStatus: 'PAID' }
    });
    console.log('Order status updated to DELIVERED.');

    // 7. Fetch Revenue Analytics via Service
    console.log('Fetching Revenue Analytics...');
    const analyticsData = await adminService.getRevenueAnalytics();
    
    console.log('\n--- REVENUE ANALYTICS JSON OUTPUT ---');
    console.log(JSON.stringify(analyticsData, null, 2));

    console.log('\n--- E2E CHECKOUT TEST COMPLETED SUCCESSFULLY ---');
    
    fs.writeFileSync('scratch/e2e_analytics_output.json', JSON.stringify(analyticsData, null, 2));
    console.log('Analytics data saved to scratch/e2e_analytics_output.json');

  } catch (error) {
    console.error('Error during E2E test:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

e2eCheckout();
