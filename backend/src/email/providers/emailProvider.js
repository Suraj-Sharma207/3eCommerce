/**
 * Abstract Base Class for Email Providers (SMTP, SES, SendGrid, etc.)
 */
export class EmailProvider {
  /**
   * Send an email
   * @param {Object} options - Email sending options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML body
   * @param {string} [options.text] - Plain text body alternative
   * @param {string} [options.from] - Sender details (e.g. "LuxeHome <no-reply@luxehome.com>")
   * @returns {Promise<{messageId: string}>} Result containing message ID
   */
  async send(options) {
    throw new Error(
      "Method 'send()' must be implemented by the provider subclass.",
    );
  }

  /**
   * Verify provider connection
   * @returns {Promise<boolean>}
   */
  async verify() {
    throw new Error(
      "Method 'verify()' must be implemented by the provider subclass.",
    );
  }
}
