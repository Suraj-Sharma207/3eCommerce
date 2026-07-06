/**
 * Centralized Environment Variable Validation
 * 
 * SECURITY: This module validates all required secrets at startup.
 * The application will fail-fast if mandatory secrets are missing or invalid.
 * This prevents the server from running with insecure defaults.
 */
import dotenv from 'dotenv';
dotenv.config({ override: true });

class EnvValidationError extends Error {
  constructor(errors) {
    const message = [
      '',
      '╔══════════════════════════════════════════════════════════════╗',
      '║         ENVIRONMENT VALIDATION FAILED — STARTUP ABORTED    ║',
      '╚══════════════════════════════════════════════════════════════╝',
      '',
      ...errors.map(e => `  ✗ ${e}`),
      '',
      '  Fix the above issues in your .env file and restart.',
      '  See .env.example for reference.',
      '',
    ].join('\n');
    super(message);
    this.name = 'EnvValidationError';
  }
}

/**
 * Validates all required environment variables and returns a typed config object.
 * Throws EnvValidationError with all issues if any validation fails.
 */
export function validateEnv() {
  const errors = [];

  // --- Mandatory Secrets ---

  // JWT_SECRET: Must exist, minimum 64 characters
  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is required. Generate with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  } else if (process.env.JWT_SECRET.length < 64) {
    errors.push(`JWT_SECRET must be at least 64 characters (currently ${process.env.JWT_SECRET.length}). Generate a stronger secret.`);
  }

  // AES_SECRET_KEY: Must exist, exactly 64 hex characters (32 bytes)
  if (!process.env.AES_SECRET_KEY) {
    errors.push('AES_SECRET_KEY is required. Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  } else if (!/^[0-9a-fA-F]{64}$/.test(process.env.AES_SECRET_KEY)) {
    errors.push('AES_SECRET_KEY must be exactly 64 hex characters (32 bytes). Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }

  // DATABASE_URL: Must exist
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required. Example: postgresql://user:pass@host:5432/dbname?sslmode=require');
  }

  // Cloudinary: All three are required
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    errors.push('CLOUDINARY_CLOUD_NAME is required.');
  }
  if (!process.env.CLOUDINARY_API_KEY) {
    errors.push('CLOUDINARY_API_KEY is required.');
  }
  if (!process.env.CLOUDINARY_API_SECRET) {
    errors.push('CLOUDINARY_API_SECRET is required.');
  }

  // SMTP: Required for email functionality
  if (!process.env.SMTP_HOST) {
    errors.push('SMTP_HOST is required for email delivery.');
  }
  if (!process.env.SMTP_USER) {
    errors.push('SMTP_USER is required for email delivery.');
  }
  if (!process.env.SMTP_PASSWORD) {
    errors.push('SMTP_PASSWORD is required for email delivery.');
  }

  // --- Optional with warnings ---

  if (!process.env.REDIS_URL) {
    console.warn('[Config] ⚠ REDIS_URL not set — rate limiting and caching will use in-memory fallback.');
  }

  if (!process.env.FRONTEND_URL) {
    console.warn('[Config] ⚠ FRONTEND_URL not set — defaulting to http://localhost:5173 for CORS and email links.');
  }

  // --- Fail-fast if any errors ---

  if (errors.length > 0) {
    throw new EnvValidationError(errors);
  }

  // --- Return validated config ---

  return {
    port: process.env.PORT || 5000,
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    aesSecretKey: process.env.AES_SECRET_KEY,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      from: process.env.SMTP_FROM || '',
    },
    redis: {
      url: process.env.REDIS_URL || null,
    },
    trustProxy: process.env.TRUST_PROXY || false,
    bulkDeleteMax: parseInt(process.env.BULK_DELETE_MAX, 10) || 100,
    chatbotServiceUrl: process.env.CHATBOT_SERVICE_URL || 'http://localhost:8000',
    chatbotApiKey: process.env.CHATBOT_API_KEY || '',
  };
}

// Validate on module load — fail-fast at startup
export const env = validateEnv();
