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
      const { default: prisma } = await import('../../lib/prisma.js');
      const rawRecord = await prisma.systemSettings.findUnique({ where: { key: 'smtp' } });
      const encryptedLength = rawRecord?.value?.password ? rawRecord.value.password.length : 0;
      
      const settings = await settingsService.getSettingsByKeys(['smtp']);
      const dbSmtp = settings.smtp;

      if (dbSmtp && dbSmtp.host && dbSmtp.user && dbSmtp.password) {
        return {
          source: 'db',
          host: dbSmtp.host,
          port: parseInt(dbSmtp.port, 10),
          secure: dbSmtp.secure === true || dbSmtp.secure === 'true',
          user: dbSmtp.user,
          password: dbSmtp.password, // Decrypted automatically by SettingsService
          fromEmail: dbSmtp.fromEmail || dbSmtp.user,
          encryptedLength
        };
      }
    } catch (error) {
      console.error('[SMTP PROVIDER] Failed to read SMTP configuration from database:', error.message);
    }

    console.log('[SMTP PROVIDER] Database SMTP configuration incomplete or missing. Falling back to .env');
    
    const fallback = emailConfig.fallbackSmtp;
    
    // Extract actual email address from SMTP_FROM if formatted as "Name <email@domain.com>"
    let parsedFrom = fallback.fromEmail;
    if (parsedFrom.includes('<') && parsedFrom.includes('>')) {
      const match = parsedFrom.match(/<([^>]+)>/);
      if (match) parsedFrom = match[1];
    }
    
    return {
      source: 'env',
      host: fallback.host,
      port: fallback.port,
      secure: fallback.secure,
      user: fallback.user,
      password: fallback.password,
      fromEmail: parsedFrom,
      encryptedLength: 0
    };
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

    console.log(`[SMTP PROVIDER] Source: ${latestConfig.source === 'db' ? 'Database' : '.env'}`);
    console.log(`[SMTP PROVIDER] Host: ${latestConfig.host}`);
    console.log(`[SMTP PROVIDER] Port: ${latestConfig.port}`);
    console.log(`[SMTP PROVIDER] Secure: ${latestConfig.secure}`);
    console.log(`[SMTP PROVIDER] Username: ${latestConfig.user}`);
    console.log(`[SMTP PROVIDER] Password Exists: ${latestConfig.password ? 'Yes' : 'No'}`);
    console.log(`[SMTP PROVIDER] Encrypted Password Length: ${latestConfig.encryptedLength}`);
    console.log(`[SMTP PROVIDER] Decrypted Password Length: ${latestConfig.password ? latestConfig.password.length : 0}`);
    
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
      console.log('[SMTP PROVIDER] Transport Verification Result: SUCCESS');
    } catch (verifyError) {
      console.error('[SMTP PROVIDER] Transport Verification Result: FAILED');
      console.error('[SMTP PROVIDER] Reason:', verifyError.message);
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
    const { brandingService } = await import('../../services/brandingService.js');
    const branding = await brandingService.getBranding();

    const mailOptions = {
      from: options.from || `"${branding.platformName}" <${fromEmail}>`,
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
