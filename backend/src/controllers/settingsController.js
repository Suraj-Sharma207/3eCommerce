import settingsService from '../services/settingsService.js';
import { logAudit } from '../services/auditLogger.js';
import { successResponse, errorResponse } from '../utils/response.js';
import nodemailer from 'nodemailer';

class SettingsController {
  
  // Internal helper
  async handleGet(req, res, domain) {
    try {
      const data = await settingsService.getSettingsByKeys([domain]);
      return successResponse(res, 'Settings fetched successfully', data[domain] || {});
    } catch (error) {
      console.error(`Error fetching ${domain} settings:`, error);
      return errorResponse(res, `Failed to fetch ${domain} settings`);
    }
  }

  // Internal helper
  async handleUpdate(req, res, domain) {
    try {
      const oldDataRaw = await settingsService.getSettingsByKeys([domain]);
      const oldData = oldDataRaw[domain] || {};

      const newData = await settingsService.updateSettings(domain, req.body);

      // Log Audit
      await logAudit({
        adminName: req.user.name,
        section: domain,
        oldValue: oldData,
        newValue: req.body, // Log unencrypted intended values
        ipAddress: req.ip || req.connection.remoteAddress
      });

      return successResponse(res, 'Settings updated successfully', newData[domain]);
    } catch (error) {
      console.error(`Error updating ${domain} settings:`, error);
      return errorResponse(res, `Failed to update ${domain} settings`);
    }
  }

  // Domain specific getters/setters
  getStore = (req, res) => this.handleGet(req, res, 'store');
  updateStore = (req, res) => this.handleUpdate(req, res, 'store');

  getShipping = (req, res) => this.handleGet(req, res, 'shipping');
  updateShipping = (req, res) => this.handleUpdate(req, res, 'shipping');

  getPayment = (req, res) => this.handleGet(req, res, 'payment');
  updatePayment = (req, res) => this.handleUpdate(req, res, 'payment');

  getSmtp = (req, res) => this.handleGet(req, res, 'smtp');
  updateSmtp = (req, res) => this.handleUpdate(req, res, 'smtp');

  getSecurity = (req, res) => this.handleGet(req, res, 'security');
  updateSecurity = (req, res) => this.handleUpdate(req, res, 'security');

  getNotifications = (req, res) => this.handleGet(req, res, 'notifications');
  updateNotifications = (req, res) => this.handleUpdate(req, res, 'notifications');

  // Test SMTP connection
  async testSmtp(req, res) {
    try {
      const { host, port, secure, user, password, fromEmail } = req.body;
      
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port),
        secure: secure === 'true' || secure === true,
        auth: { user, pass: password }
      });

      await transporter.verify();

      // Optionally send a test email
      await transporter.sendMail({
        from: `"${fromEmail}" <${user}>`,
        to: req.user.email,
        subject: 'SMTP Test Successful',
        text: 'Your SMTP configuration is working correctly.'
      });

      return successResponse(res, 'SMTP connection verified successfully', null);
    } catch (error) {
      console.error('SMTP test failed:', error);
      return errorResponse(res, `SMTP test failed: ${error.message}`, [], 400);
    }
  }

  // Public endpoint for storefront config
  async getPublicConfig(req, res) {
    try {
      const data = await settingsService.getSettingsByKeys(['store', 'payment']);
      
      const storeConfig = data.store || {};
      const paymentConfig = data.payment || {};

      // EXPOSE ONLY PUBLIC FIELDS
      const publicConfig = {
        storeName: storeConfig.storeName,
        currency: storeConfig.currency,
        currencySymbol: storeConfig.currencySymbol,
        stripePublicKey: paymentConfig.stripePublicKey,
      };

      return successResponse(res, 'Public config fetched', publicConfig);
    } catch (error) {
      return errorResponse(res, 'Failed to fetch public config');
    }
  }

  // Get email preview (HTML) for development and inspection
  async getEmailPreview(req, res) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Email preview is disabled in production.' });
    }

    try {
      const { template } = req.query;
      if (!template) {
        return res.status(400).json({ message: 'Template name is required.' });
      }

      const mockData = mockDataMap[template];
      if (!mockData) {
        return res.status(400).json({ 
          message: `Mock data for template "${template}" is not defined. Available templates: ${Object.keys(mockDataMap).join(', ')}` 
        });
      }

      const { renderTemplate } = await import('../email/utils/templateCompiler.js');
      const rendered = renderTemplate(template, mockData);

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(rendered.html);
    } catch (error) {
      console.error('Email preview failed:', error);
      return res.status(500).json({ message: `Email preview failed: ${error.message}` });
    }
  }
}

const mockDataMap = {
  welcome: { name: 'John Doe', shopUrl: 'http://localhost:5173/products' },
  'verify-email': { name: 'John Doe', verificationUrl: 'http://localhost:5173/verify-email?token=testtoken' },
  'password-reset': { name: 'John Doe', resetUrl: 'http://localhost:5173/reset-password?token=testtoken' },
  'order-confirmation': {
    name: 'John Doe',
    orderNumber: 'LH-123456-IN',
    orderDate: 'June 26, 2026',
    paymentMethod: 'Credit Card',
    shippingAddress: {
      recipientName: 'John Doe',
      street: '123 Luxury Lane',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India',
      phoneNumber: '+91 9876543210'
    },
    items: [
      {
        product: { name: 'Modern Fabric Sofa', sku: 'FURN-LIV-1001', thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=1000' },
        quantity: 1,
        formattedPrice: '₹45,999.00',
        formattedTotal: '₹45,999.00'
      },
      {
        product: { name: 'Minimalist Coffee Table', sku: 'FURN-LIV-1002', thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=1000' },
        quantity: 2,
        formattedPrice: '₹12,999.00',
        formattedTotal: '₹25,998.00'
      }
    ],
    formattedSubtotal: '₹71,997.00',
    formattedDiscount: '₹5,000.00',
    formattedShipping: '₹99.00',
    formattedTax: '₹12,059.46',
    formattedTotal: '₹79,155.46',
    trackUrl: 'http://localhost:5173/orders',
    shopUrl: 'http://localhost:5173/products',
    invoiceUrl: 'http://localhost:5173/orders'
  },
  'order-shipped': {
    name: 'John Doe',
    orderNumber: 'LH-123456-IN',
    courier: 'DHL Express',
    trackingNumber: 'LH-987654-IN',
    estimatedDelivery: 'Tuesday, June 30, 2026',
    trackingUrl: 'https://track.luxehome.com?num=LH-987654-IN'
  },
  'order-delivered': {
    name: 'John Doe',
    orderNumber: 'LH-123456-IN',
    deliveredDate: 'Friday, June 26, 2026',
    rateProductUrl: 'http://localhost:5173/orders',
    shopUrl: 'http://localhost:5173/products'
  },
  'order-cancelled': {
    name: 'John Doe',
    orderNumber: 'LH-123456-IN',
    cancellationReason: 'Out of stock items could not be fulfilled',
    shopUrl: 'http://localhost:5173/products'
  },
  refund: {
    name: 'John Doe',
    orderNumber: 'LH-123456-IN',
    refundAmount: '₹79,155.46',
    paymentMethod: 'Credit Card',
    processedDate: 'June 26, 2026',
    shopUrl: 'http://localhost:5173'
  },
  'low-stock': {
    productName: 'Modern Fabric Sofa',
    sku: 'FURN-LIV-1001',
    currentStock: 2,
    threshold: 5,
    restockUrl: 'http://localhost:5173/admin/products'
  },
  'admin-order': {
    orderNumber: 'LH-123456-IN',
    customerName: 'John Doe',
    customerEmail: 'johndoe@example.com',
    grandTotal: '₹79,155.46',
    paymentMethod: 'Credit/Debit Card',
    viewOrderUrl: 'http://localhost:5173/admin/orders'
  }
};

export default new SettingsController();
