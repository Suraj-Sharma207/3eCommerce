import { EventEmitter } from 'events';
import emailService from '../services/emailService.js';
import settingsService from '../../services/settingsService.js';

class EmailEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.registerListeners();
  }

  registerListeners() {
    // User Registration Welcome Email
    this.on('user.registered', async (user) => {
      try {
        console.log(`[EVENT] Received user.registered for ${user.email}. Triggering welcome email...`);
        await emailService.sendWelcome(user);
      } catch (err) {
        console.error('[EVENT ERROR] Failed welcome dispatch:', err);
      }
    });

    // Email Verification Requested
    this.on('user.verification_requested', async ({ user, verificationUrl }) => {
      try {
        console.log(`[EVENT] Received user.verification_requested for ${user.email}. Triggering verification email...`);
        await emailService.sendEmailVerification(user, verificationUrl);
      } catch (err) {
        console.error('[EVENT ERROR] Failed verification dispatch:', err);
      }
    });

    // Password Reset Requested
    this.on('user.password_reset_requested', async ({ user, resetUrl }) => {
      try {
        console.log(`[EVENT] Received user.password_reset_requested for ${user.email}. Triggering reset email...`);
        await emailService.sendPasswordReset(user, resetUrl);
      } catch (err) {
        console.error('[EVENT ERROR] Failed password reset dispatch:', err);
      }
    });

    // Order Placed / Created
    this.on('order.created', async (order) => {
      try {
        console.log(`[EVENT] Received order.created for #${order.orderNumber}. Dispatching confirmation...`);
        await emailService.sendOrderConfirmation(order.user.email, order);
        
        // Fetch Admin email from system notifications or default
        const settings = await settingsService.getSettingsByKeys(['notifications', 'store']);
        const adminEmail = settings.store?.storeEmail || 'admin@luxehome.com';
        
        await emailService.sendAdminNewOrder(adminEmail, order);
      } catch (err) {
        console.error('[EVENT ERROR] Failed order confirmation dispatch:', err);
      }
    });

    // Order Shipped
    this.on('order.shipped', async ({ order, courier, trackingNumber, estimatedDelivery }) => {
      try {
        console.log(`[EVENT] Received order.shipped for #${order.orderNumber}. Dispatching shipment email...`);
        await emailService.sendOrderShipped(order.user.email, order, {
          courier,
          trackingNumber,
          estimatedDelivery
        });
      } catch (err) {
        console.error('[EVENT ERROR] Failed order shipped dispatch:', err);
      }
    });

    // Order Delivered
    this.on('order.delivered', async ({ order, deliveredDate }) => {
      try {
        console.log(`[EVENT] Received order.delivered for #${order.orderNumber}. Dispatching delivery email...`);
        await emailService.sendOrderDelivered(order.user.email, order, deliveredDate);
      } catch (err) {
        console.error('[EVENT ERROR] Failed order delivered dispatch:', err);
      }
    });

    // Order Cancelled
    this.on('order.cancelled', async ({ order, cancellationReason }) => {
      try {
        console.log(`[EVENT] Received order.cancelled for #${order.orderNumber}. Dispatching cancellation email...`);
        await emailService.sendOrderCancelled(order.user.email, order, cancellationReason);
      } catch (err) {
        console.error('[EVENT ERROR] Failed order cancelled dispatch:', err);
      }
    });

    // Refund Processed
    this.on('order.refunded', async ({ order, refundAmount }) => {
      try {
        console.log(`[EVENT] Received order.refunded for #${order.orderNumber}. Dispatching refund email...`);
        await emailService.sendRefund(order.user.email, order, refundAmount);
      } catch (err) {
        console.error('[EVENT ERROR] Failed refund email dispatch:', err);
      }
    });

    // Low Stock Alert
    this.on('product.low_stock', async ({ product, threshold }) => {
      try {
        console.log(`[EVENT] Received product.low_stock for ${product.name} (Stock: ${product.stock}). Dispatching alert...`);
        const settings = await settingsService.getSettingsByKeys(['notifications', 'store']);
        const adminEmail = settings.store?.storeEmail || 'admin@luxehome.com';
        await emailService.sendLowStockAlert(adminEmail, product, threshold);
      } catch (err) {
        console.error('[EVENT ERROR] Failed low stock alert dispatch:', err);
      }
    });
  }
}

const emailEvents = new EmailEventEmitter();
export default emailEvents;
