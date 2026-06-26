import { renderTemplate } from '../utils/templateCompiler.js';
import emailQueue from '../queue/emailQueue.js';
import settingsService from '../../services/settingsService.js';

class EmailService {
  /**
   * Helper to format currency values based on system settings
   */
  async getCurrencySymbol() {
    try {
      const settings = await settingsService.getSettingsByKeys(['store']);
      return settings.store?.currencySymbol || '₹';
    } catch (error) {
      return '₹';
    }
  }

  formatPrice(amount, symbol = '₹') {
    return `${symbol}${Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  /**
   * Direct low-level email sending helper
   */
  async sendEmail(to, subject, html, text, options = {}) {
    return await emailQueue.add({
      recipient: to,
      subject,
      html,
      text,
      template: 'direct',
      userId: options.userId,
      idempotencyKey: options.idempotencyKey
    });
  }

  /**
   * Render template and enqueue sending
   */
  async sendTemplate(to, subject, templateName, data = {}, options = {}) {
    const { html, text } = renderTemplate(templateName, data);
    return await emailQueue.add({
      recipient: to,
      subject,
      html,
      text,
      template: templateName,
      userId: options.userId,
      idempotencyKey: options.idempotencyKey
    });
  }

  /**
   * Send Welcome Email
   */
  async sendWelcome(user) {
    const websiteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return await this.sendTemplate(
      user.email,
      'Welcome to LuxeHome!',
      'welcome',
      {
        name: user.name,
        shopUrl: `${websiteUrl}/products`
      },
      {
        userId: user.id,
        idempotencyKey: `welcome-${user.id}`
      }
    );
  }

  /**
   * Send Email Verification
   */
  async sendEmailVerification(user, verificationUrl) {
    const token = verificationUrl.split('token=').pop() || '';
    return await this.sendTemplate(
      user.email,
      'Verify Your LuxeHome Email',
      'verify-email',
      {
        name: user.name,
        verificationUrl
      },
      {
        userId: user.id,
        idempotencyKey: `verify-${user.id}-${token.substring(0, 30)}`
      }
    );
  }

  /**
   * Send Password Reset Link
   */
  async sendPasswordReset(user, resetUrl) {
    const token = resetUrl.split('token=').pop() || '';
    return await this.sendTemplate(
      user.email,
      'Reset Your LuxeHome Password',
      'password-reset',
      {
        name: user.name,
        resetUrl
      },
      {
        userId: user.id,
        idempotencyKey: `reset-password-${user.id}-${token.substring(0, 30)}`
      }
    );
  }

  /**
   * Send Order Confirmation Email to Customer
   */
  async sendOrderConfirmation(userEmail, order) {
    const symbol = await this.getCurrencySymbol();
    const websiteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const formattedItems = order.items.map(item => ({
      ...item,
      formattedPrice: this.formatPrice(item.price, symbol),
      formattedTotal: this.formatPrice(item.price * item.quantity, symbol)
    }));

    return await this.sendTemplate(
      userEmail,
      `LuxeHome Order Confirmed - #${order.orderNumber}`,
      'order-confirmation',
      {
        name: order.user?.name || 'Valued Customer',
        orderNumber: order.orderNumber,
        orderDate: new Date(order.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        paymentMethod: order.paymentMethod || 'Credit Card',
        shippingAddress: order.shippingAddress,
        items: formattedItems,
        formattedSubtotal: this.formatPrice(order.subtotal || order.totalAmount, symbol),
        formattedDiscount: this.formatPrice(order.discountAmount || 0, symbol),
        formattedShipping: this.formatPrice(order.shippingCharge || 0, symbol),
        formattedTax: this.formatPrice(order.taxAmount || 0, symbol),
        formattedTotal: this.formatPrice(order.totalAmount, symbol),
        trackUrl: `${websiteUrl}/orders`,
        shopUrl: `${websiteUrl}/products`,
        invoiceUrl: `${websiteUrl}/orders` // Link to client orders page for downloading invoice
      },
      {
        userId: order.userId,
        idempotencyKey: `order-confirm-${order.id}`
      }
    );
  }

  /**
   * Send Order Shipped Email to Customer
   */
  async sendOrderShipped(userEmail, order, courierInfo = {}) {
    const websiteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    const courier = courierInfo.courier || 'LuxeHome Express (DHL)';
    const trackingNumber = courierInfo.trackingNumber || `LH-${Math.floor(100000 + Math.random() * 900000)}-IN`;
    
    let estDelivery = courierInfo.estimatedDelivery;
    if (!estDelivery) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 4);
      estDelivery = futureDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    return await this.sendTemplate(
      userEmail,
      `Your LuxeHome Order Shipped! - #${order.orderNumber}`,
      'order-shipped',
      {
        name: order.user?.name || 'Valued Customer',
        orderNumber: order.orderNumber,
        courier,
        trackingNumber,
        estimatedDelivery: estDelivery,
        trackingUrl: `https://track.luxehome.com?num=${trackingNumber}`
      },
      {
        userId: order.userId,
        idempotencyKey: `order-shipped-${order.id}`
      }
    );
  }

  /**
   * Send Order Delivered Email to Customer
   */
  async sendOrderDelivered(userEmail, order, deliveredDateStr = null) {
    const websiteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    let deliveredDate = deliveredDateStr;
    try {
      const parsedDate = deliveredDateStr ? new Date(deliveredDateStr) : new Date();
      if (!isNaN(parsedDate.getTime())) {
        deliveredDate = parsedDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch (e) {
      deliveredDate = deliveredDateStr || new Date().toLocaleDateString();
    }

    return await this.sendTemplate(
      userEmail,
      `LuxeHome Order Delivered! - #${order.orderNumber}`,
      'order-delivered',
      {
        name: order.user?.name || 'Valued Customer',
        orderNumber: order.orderNumber,
        deliveredDate,
        rateProductUrl: `${websiteUrl}/orders`,
        shopUrl: `${websiteUrl}/products`
      },
      {
        userId: order.userId,
        idempotencyKey: `order-delivered-${order.id}`
      }
    );
  }

  /**
   * Send Order Cancelled Email to Customer
   */
  async sendOrderCancelled(userEmail, order, cancellationReason = 'Customer requested cancellation') {
    const websiteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    return await this.sendTemplate(
      userEmail,
      `LuxeHome Order Cancelled - #${order.orderNumber}`,
      'order-cancelled',
      {
        name: order.user?.name || 'Valued Customer',
        orderNumber: order.orderNumber,
        cancellationReason,
        shopUrl: `${websiteUrl}/products`
      },
      {
        userId: order.userId,
        idempotencyKey: `order-cancelled-${order.id}`
      }
    );
  }

  /**
   * Send Refund Email to Customer
   */
  async sendRefund(userEmail, order, refundAmountRaw = null) {
    const symbol = await this.getCurrencySymbol();
    const websiteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    const refundAmount = refundAmountRaw 
      ? this.formatPrice(refundAmountRaw, symbol) 
      : this.formatPrice(order.totalAmount, symbol);

    return await this.sendTemplate(
      userEmail,
      `LuxeHome Refund Processed - #${order.orderNumber}`,
      'refund',
      {
        name: order.user?.name || 'Valued Customer',
        orderNumber: order.orderNumber,
        refundAmount,
        paymentMethod: order.paymentMethod || 'Original Payment Method',
        processedDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        shopUrl: websiteUrl
      },
      {
        userId: order.userId,
        idempotencyKey: `order-refund-${order.id}-${refundAmount.replace(/[^0-9.]/g, '')}`
      }
    );
  }

  /**
   * Send Low Stock Alert Email to Admin
   */
  async sendLowStockAlert(adminEmail, product, threshold) {
    const websiteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    return await this.sendTemplate(
      adminEmail,
      `🚨 LuxeHome Low Stock Alert: ${product.name}`,
      'low-stock',
      {
        productName: product.name,
        sku: product.sku || 'N/A',
        currentStock: product.stock,
        threshold,
        restockUrl: `${websiteUrl}/admin/products`
      },
      {
        idempotencyKey: `low-stock-${product.id}-${product.stock}`
      }
    );
  }

  /**
   * Send Admin New Order Notification
   */
  async sendAdminNewOrder(adminEmail, order) {
    const symbol = await this.getCurrencySymbol();
    const websiteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    return await this.sendTemplate(
      adminEmail,
      `🚨 New Order Received - #${order.orderNumber}`,
      'admin-order',
      {
        orderNumber: order.orderNumber,
        customerName: order.user?.name || 'Guest',
        customerEmail: order.user?.email || 'N/A',
        grandTotal: this.formatPrice(order.totalAmount, symbol),
        paymentMethod: order.paymentMethod || 'COD',
        viewOrderUrl: `${websiteUrl}/admin/orders`
      },
      {
        idempotencyKey: `admin-order-${order.id}`
      }
    );
  }
}

export default new EmailService();
