import settingsService from '../services/settingsService.js';
import { logAudit } from '../services/auditLogger.js';
import { successResponse, errorResponse } from '../utils/response.js';
import nodemailer from 'nodemailer';

class SettingsController {
  
  // Internal helper
  async handleGet(req, res, domain) {
    try {
      const data = await settingsService.getSettingsByKeys([domain]);
      let responseData = data[domain] || {};
      
      // Never expose passwords or secrets to frontend
      if (domain === 'smtp') {
        if (responseData.password) {
          responseData.passwordConfigured = true;
          delete responseData.password;
        } else {
          responseData.passwordConfigured = false;
        }
      }
      
      return successResponse(res, 'Settings fetched successfully', responseData);
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

      const dataToSave = { ...req.body };
      // Settings service will natively preserve existing encrypted password if dataToSave.password is omitted/empty.

      const newData = await settingsService.updateSettings(domain, dataToSave);

      // Log Audit
      await logAudit({
        adminName: req.user.name,
        section: domain,
        oldValue: oldData,
        newValue: req.body, // Log unencrypted intended values
        ipAddress: req.ip || req.connection.remoteAddress
      });

      let responseData = newData[domain] || {};
      if (domain === 'smtp') {
        if (responseData.password) {
          responseData.passwordConfigured = true;
          delete responseData.password;
        } else {
          responseData.passwordConfigured = false;
        }
      }

      return successResponse(res, 'Settings updated successfully', responseData);
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
    let { host, port, secure, user, password, fromEmail } = req.body;
    const toEmail = req.user?.email;

    // Use DB password if it's omitted
    if (!password || password.trim() === '') {
      const dbSettings = await settingsService.getSettingsByKeys(['smtp']);
      if (dbSettings.smtp?.password) {
        password = dbSettings.smtp.password;
      }
    }

    // Validation
    if (!host) return errorResponse(res, 'SMTP configuration incomplete: missing host', [], 400);
    if (!port) return errorResponse(res, 'SMTP configuration incomplete: missing port', [], 400);
    if (!user) return errorResponse(res, 'SMTP configuration incomplete: missing username', [], 400);
    if (!password) return res.status(400).json({ success: false, message: 'SMTP password has not been configured.' });
    if (!fromEmail) return errorResponse(res, 'SMTP configuration incomplete: missing sender email', [], 400);
    if (!toEmail) return errorResponse(res, 'Recipient email missing', [], 400);

    let transporter;
    try {
      transporter = nodemailer.createTransport({
        host,
        port: parseInt(port),
        secure: secure === 'true' || secure === true,
        auth: { user, pass: password }
      });
    } catch (err) {
      console.error('[SMTP TEST] Failed to create transporter:', err);
      return errorResponse(res, 'Failed to create SMTP transporter', [], 400);
    }

    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error(`[SMTP TEST] Verification failed. Host: ${host}:${port}, Secure: ${secure}, User: ${user}, PassLength: ${password?.length || 0}`);
      
      let reason = verifyError.message;
      if (verifyError.responseCode === 535 || reason.includes('535') || reason.includes('Username and Password not accepted')) {
        reason = 'Invalid Gmail App Password or Username and Password not accepted';
      } else if (verifyError.code === 'ETIMEDOUT') {
        reason = 'Connection timeout';
      }
      
      return errorResponse(res, reason, [], 400);
    }

    try {
      await transporter.sendMail({
        from: `"${fromEmail}" <${user}>`,
        to: toEmail,
        subject: 'SMTP Test Successful',
        text: 'Your SMTP configuration is working correctly.'
      });
      return successResponse(res, 'SMTP connection verified successfully', null);
    } catch (sendError) {
      console.error(`[SMTP TEST] Send failed. Host: ${host}:${port}, User: ${user}, PassLength: ${password?.length || 0}`, sendError);
      return errorResponse(res, `Failed to send test email: ${sendError.message}`, [], 400);
    }
  }

  // Diagnostic Endpoint
  async diagnosticSmtp(req, res) {
    try {
      const { default: smtpProvider } = await import('../email/providers/smtpProvider.js');
      
      const config = await smtpProvider.getLatestSmtpConfig();
      const isFallback = config.source === 'env';
      
      const diagnostics = {
        configurationLoaded: true,
        configurationSource: isFallback ? 'Environment Variables (.env)' : 'Database (SystemSettings)',
        passwordExists: !!config.password,
        passwordDecryptsSuccessfully: !!config.password && !isFallback, // Decrypted successfully if it exists in DB
        transporterCreation: false,
        smtpConnection: false,
        gmailAuthentication: false,
        testEmailDelivery: false
      };

      try {
        const transporter = nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: { user: config.user, pass: config.password }
        });
        diagnostics.transporterCreation = true;

        await transporter.verify();
        diagnostics.smtpConnection = true;
        diagnostics.gmailAuthentication = true;

        const toEmail = req.user?.email || 'admin@luxehome.com';
        await transporter.sendMail({
          from: `"${config.fromEmail}" <${config.user}>`,
          to: toEmail,
          subject: 'LuxeHome SMTP Diagnostics Test',
          text: 'This is a diagnostic email from the LuxeHome SMTP test suite.'
        });
        diagnostics.testEmailDelivery = true;
        
        return successResponse(res, 'SMTP Diagnostics completed successfully', diagnostics);
      } catch (err) {
        let reason = err.message;
        if (err.responseCode === 535 || reason.includes('535') || reason.includes('Username and Password not accepted')) {
          reason = 'Invalid Gmail App Password or Username and Password not accepted';
          diagnostics.gmailAuthentication = false;
        }
        return errorResponse(res, `SMTP Diagnostics failed: ${reason}`, diagnostics, 400);
      }
    } catch (error) {
      return errorResponse(res, `Diagnostics system error: ${error.message}`, null, 500);
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
        lowStockThreshold: storeConfig.lowStockThreshold || 5,
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
