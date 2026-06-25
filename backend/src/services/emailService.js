/**
 * Mock Email Service for Assessment
 * Logs structured messages to the console to simulate sending emails.
 */

class EmailService {
  async sendOrderConfirmation(userEmail, orderDetails) {
    console.log(`\n======================================================`);
    console.log(`[EMAIL SERVICE] 📧 Sending Order Confirmation Email`);
    console.log(`To: ${userEmail}`);
    console.log(`Subject: Order Confirmation - ${orderDetails.orderNumber}`);
    console.log(`Total: $${orderDetails.totalAmount}`);
    console.log(`Status: ${orderDetails.paymentStatus}`);
    console.log(`======================================================\n`);
    
    return true;
  }

  async sendNewOrderNotification(adminEmail, orderDetails) {
    console.log(`\n======================================================`);
    console.log(`[EMAIL SERVICE] 🚨 Sending Admin Notification Email`);
    console.log(`To: ${adminEmail}`);
    console.log(`Subject: New Order Received - ${orderDetails.orderNumber}`);
    console.log(`======================================================\n`);
    
    return true;
  }
}

export default new EmailService();
