/**
 * Legacy Email Service Proxy
 * Delegating all operations to the new Domain-Driven Transactional Email Service.
 */
import newEmailService from '../email/services/emailService.js';

class LegacyEmailServiceProxy {
  async sendOrderConfirmation(userEmail, order) {
    return await newEmailService.sendOrderConfirmation(userEmail, order);
  }

  async sendNewOrderNotification(adminEmail, order) {
    return await newEmailService.sendAdminNewOrder(adminEmail, order);
  }

  // Fall through other methods to act as a complete proxy
  async sendWelcome(user) {
    return await newEmailService.sendWelcome(user);
  }

  async sendEmailVerification(user, url) {
    return await newEmailService.sendEmailVerification(user, url);
  }

  async sendPasswordReset(user, url) {
    return await newEmailService.sendPasswordReset(user, url);
  }

  async sendOrderShipped(userEmail, order, courierInfo) {
    return await newEmailService.sendOrderShipped(userEmail, order, courierInfo);
  }

  async sendOrderDelivered(userEmail, order, date) {
    return await newEmailService.sendOrderDelivered(userEmail, order, date);
  }

  async sendOrderCancelled(userEmail, order, reason) {
    return await newEmailService.sendOrderCancelled(userEmail, order, reason);
  }

  async sendRefund(userEmail, order, amount) {
    return await newEmailService.sendRefund(userEmail, order, amount);
  }

  async sendLowStockAlert(adminEmail, product, threshold) {
    return await newEmailService.sendLowStockAlert(adminEmail, product, threshold);
  }
}

export default new LegacyEmailServiceProxy();
