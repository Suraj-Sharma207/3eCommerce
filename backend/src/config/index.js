/**
 * Application Configuration
 * 
 * SECURITY: All secrets are sourced from validated environment variables.
 * No insecure fallback values. The application will not start without
 * properly configured secrets (see config/env.js).
 */
import { env } from './env.js';

export const config = {
  port: env.port,
  jwtSecret: env.jwtSecret,
  jwtExpiresIn: env.jwtExpiresIn,
  aesSecretKey: env.aesSecretKey,
};
