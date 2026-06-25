export const emailConfig = {
  // Retry options
  maxRetries: 3,
  retryDelayMs: 5000, // Initial delay for exponential backoff (e.g. 5s, 10s, 20s)
  
  // Default values if settings are not defined in DB
  defaults: {
    supportEmail: 'support@luxehome.com',
    supportPhone: '+1 (800) 555-LUXE',
    websiteUrl: 'http://localhost:5173',
    facebookUrl: 'https://facebook.com/luxehome',
    instagramUrl: 'https://instagram.com/luxehome',
    twitterUrl: 'https://twitter.com/luxehome',
  },
  
  // SMTP fallback (if system settings table is empty, fall back to environment variables)
  fallbackSmtp: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    fromEmail: process.env.SMTP_FROM || 'no-reply@luxehome.com',
  }
};
