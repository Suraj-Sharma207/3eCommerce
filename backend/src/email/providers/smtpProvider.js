import nodemailer from 'nodemailer';
import { EmailProvider } from './emailProvider.js';
import settingsService from '../../services/settingsService.js';
import { emailConfig } from '../config/emailConfig.js';

class SmtpProvider extends EmailProvider {
  constructor() {
    super();
    this.transporter = null;
    this.cachedConfigHash = null;
  }

  /**
   * Fetches latest decrypted settings or falls back
   */
  async getLatestSmtpConfig() {
    try {
      const settings = await settingsService.getSettingsByKeys(['smtp']);
      const dbSmtp = settings.smtp;

      if (dbSmtp && dbSmtp.host && dbSmtp.user) {
        return {
          host: dbSmtp.host,
          port: parseInt(dbSmtp.port, 10),
          secure: dbSmtp.secure === true || dbSmtp.secure === 'true',
          user: dbSmtp.user,
          password: dbSmtp.password, // Decrypted automatically by SettingsService
          fromEmail: dbSmtp.fromEmail || dbSmtp.user
        };
      }
    } catch (error) {
      console.error('[SMTP PROVIDER] Failed to read SMTP configuration from database:', error);
    }

    return emailConfig.fallbackSmtp;
  }

  /**
   * Reuses or creates the connection pool transporter
   */
  async getTransporter() {
    const latestConfig = await this.getLatestSmtpConfig();
    const configHash = JSON.stringify({
      host: latestConfig.host,
      port: latestConfig.port,
      secure: latestConfig.secure,
      user: latestConfig.user,
      password: latestConfig.password
    });

    if (this.transporter && this.cachedConfigHash === configHash) {
      return { transporter: this.transporter, fromEmail: latestConfig.fromEmail };
    }

    if (this.transporter) {
      console.log('[SMTP PROVIDER] SMTP settings modified. Closing existing connection pool...');
      try {
        this.transporter.close();
      } catch (err) {
        // Suppress close errors
      }
    }

    console.log(`[SMTP PROVIDER] Establishing new pooled SMTP transporter for ${latestConfig.host}:${latestConfig.port}`);
    
    const transporter = nodemailer.createTransport({
      host: latestConfig.host,
      port: latestConfig.port,
      secure: latestConfig.secure,
      pool: true, // Connection pooling enabled
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 5, // Limit sending rate to prevent spam flags
      auth: {
        user: latestConfig.user,
        pass: latestConfig.password
      }
    });

    try {
      await transporter.verify();
      console.log('[SMTP PROVIDER] SMTP Connection pool verified successfully.');
    } catch (verifyError) {
      console.error('[SMTP PROVIDER] SMTP Connection pool verification failed:', verifyError.message);
      this.transporter = null;
      this.cachedConfigHash = null;
      throw verifyError;
    }

    this.transporter = transporter;
    this.cachedConfigHash = configHash;
    return { transporter: this.transporter, fromEmail: latestConfig.fromEmail };
  }

  /**
   * Send transactional email using SMTP pooled connection
   */
  async send(options) {
    const { transporter, fromEmail } = await this.getTransporter();

    const mailOptions = {
      from: options.from || `"LuxeHome" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    };

    const info = await transporter.sendMail(mailOptions);
    return { messageId: info.messageId };
  }

  /**
   * Verify SMTP connection handshake
   */
  async verify() {
    const { transporter } = await this.getTransporter();
    return await transporter.verify();
  }
}

export default new SmtpProvider();
