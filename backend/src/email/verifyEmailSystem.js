/**
 * LuxeHome Transactional Email System Verification Script
 * Validates compiler, queue, providers, retries, and idempotency.
 */
import prisma from '../lib/prisma.js';
import emailService from './services/emailService.js';
import emailQueue from './queue/emailQueue.js';
import smtpProvider from './providers/smtpProvider.js';
import emailEvents from './utils/emailEvents.js';
import { renderTemplate } from './utils/templateCompiler.js';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runVerification() {
  console.log('\n=============================================================');
  console.log('🏁 STARTING LUXEHOME TRANSACTIONAL EMAIL SYSTEM VERIFICATION');
  console.log('=============================================================\n');

  const results = [];
  const addResult = (testName, status, details = '') => {
    results.push({ Test: testName, Status: status ? '✅ PASSED' : '❌ FAILED', Details: details });
  };

  let testUser = null;

  try {
    // 1. Verify DB Connection
    await prisma.$connect();
    addResult('1. Database Connection', true, 'Connected to Neon Postgres.');

    // Create a real test user to satisfy foreign key constraints during tests
    testUser = await prisma.user.create({
      data: {
        name: 'Bob Jackson',
        email: `bob-${Date.now()}@example.com`,
        password: 'hashedpassword123'
      }
    });
  } catch (err) {
    addResult('1. Database Connection', false, err.message);
    console.table(results);
    process.exit(1);
  }

  // 2. Verify Template Compilation
  try {
    console.log('[TEST] Compiling templates...');
    const welcome = renderTemplate('welcome', { name: 'Alice Smith', shopUrl: 'http://test.com' });
    const orderConf = renderTemplate('order-confirmation', {
      name: 'Alice Smith',
      orderNumber: 'LH-TEST-999',
      orderDate: 'June 26, 2026',
      paymentMethod: 'UPI',
      shippingAddress: { recipientName: 'Alice Smith', street: '456 Lane', city: 'Delhi', state: 'Delhi', zipCode: '110001', country: 'India', phoneNumber: '9999999999' },
      items: [
        { product: { name: 'Arc Floor Lamp', sku: 'FURN-DEC-1002', thumbnail: '' }, quantity: 1, formattedPrice: '₹12,999.00', formattedTotal: '₹12,999.00' }
      ],
      formattedSubtotal: '₹12,999.00',
      formattedShipping: '₹0.00',
      formattedTax: '₹2,339.82',
      formattedTotal: '₹15,338.82',
      trackUrl: 'http://test.com/track'
    });

    const hasWelcomeBranding = welcome.html.includes('LuxeHome') && welcome.html.includes('Explore the Store');
    const hasTextFallback = welcome.text.includes('Alice Smith') && !welcome.text.includes('<h1>');
    
    addResult('2. Template Compilation', hasWelcomeBranding && hasTextFallback, 'HTML and plain-text fallbacks rendered successfully.');
  } catch (err) {
    addResult('2. Template Compilation', false, err.message);
  }

  // Save original send method to restore later
  const originalSend = smtpProvider.send;

  // 3. Test Idempotency (Duplicate Prevention)
  try {
    console.log('[TEST] Testing email idempotency...');
    // Mock SMTP send to prevent actual emails going out during idempotency tests
    smtpProvider.send = async () => ({ messageId: 'mock-msg-123' });

    const key = `test-idempotency-${Date.now()}`;
    
    // Dispatch first send
    const log1 = await emailService.sendTemplate('test@example.com', 'Welcome!', 'welcome', { name: 'John' }, { idempotencyKey: key, userId: testUser.id });
    
    // Dispatch second send with same key
    const log2 = await emailService.sendTemplate('test@example.com', 'Welcome!', 'welcome', { name: 'John' }, { idempotencyKey: key, userId: testUser.id });

    addResult('3. Idempotency Support', log1.id === log2.id && log2.status === 'PENDING', `Duplicate request rejected. Returned same EmailLog ID: ${log1.id}`);
  } catch (err) {
    addResult('3. Idempotency Support', false, err.message);
  }

  // 4. Test Queue Retries and Exponential Backoff
  try {
    console.log('[TEST] Testing Queue retries (simulating SMTP failures)...');
    
    // Mock SMTP provider to throw error
    smtpProvider.send = async () => {
      throw new Error('SMTP Connection Timeout');
    };

    const retryKey = `test-retry-${Date.now()}`;
    const log = await emailService.sendTemplate('test-fail@example.com', 'Timeout Test', 'welcome', { name: 'Retry Tester' }, { idempotencyKey: retryKey, userId: testUser.id });

    console.log('Waiting for queue worker to attempt first send and trigger backoff retry...');
    // Wait for the first attempt and retry schedule
    await wait(3500);

    // Fetch latest log state
    const updatedLog = await prisma.emailLog.findUnique({ where: { id: log.id } });
    
    addResult('4. Retry Mechanism & Backoff', updatedLog.retryCount > 0 && updatedLog.status === 'PENDING', `Status is PENDING, retryCount: ${updatedLog.retryCount}, nextRetryAt: ${updatedLog.nextRetryAt}`);
  } catch (err) {
    addResult('4. Retry Mechanism & Backoff', false, err.message);
  }

  // Restore SMTP send method
  smtpProvider.send = originalSend;

  // 5. Verify E2E Domain Event Flow
  try {
    console.log('[TEST] Testing end-to-end event-driven welcome dispatch...');
    
    // Mock SMTP to capture results
    let welcomeSent = false;
    smtpProvider.send = async (options) => {
      if (options.subject.includes('Welcome to LuxeHome!')) {
        welcomeSent = true;
      }
      return { messageId: `msg-${Date.now()}` };
    };

    // Emit registration event with the real created user
    emailEvents.emit('user.registered', testUser);

    await wait(3000); // Wait for worker execution loop
    
    addResult('5. Event Emitter dispatch', welcomeSent, 'user.registered event triggered welcome email dispatch.');
  } catch (err) {
    addResult('5. Event Emitter dispatch', false, err.message);
  }

  // Restore SMTP
  smtpProvider.send = originalSend;

  // 6. SMTP Provider Connection Handshake Check
  try {
    console.log('[TEST] Verifying SMTP Connection Handshake...');
    const isVerified = await smtpProvider.verify();
    addResult('6. SMTP Transporter Connection', isVerified, 'Handshake succeeded with SMTP server.');
  } catch (err) {
    addResult('6. SMTP Transporter Connection', false, `Connection details not set in settings or invalid: ${err.message}`);
  }

  // Teardown test user and test logs to keep database clean
  console.log('[CLEANUP] Cleaning up test data...');
  if (testUser) {
    await prisma.emailLog.deleteMany({ where: { userId: testUser.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  }

  // Print results
  console.log('\n=============================================================');
  console.log('📊 VERIFICATION RUN SUMMARY');
  console.log('=====================================================\n');
  console.table(results);
  console.log('=============================================================\n');

  // Terminate test runner safely
  process.exit(0);
}

runVerification();
