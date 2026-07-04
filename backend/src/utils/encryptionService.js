/**
 * Unified Encryption Service (AES-256-GCM)
 * 
 * SECURITY: Replaces duplicate crypto.js and aes256.js implementations.
 * Single source of truth for all encryption operations.
 * Key is sourced from validated environment config — no fallbacks.
 * 
 * Format: iv(32hex):authTag(32hex):ciphertext(hex)
 */
import crypto from 'crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128-bit IV for GCM

// SECURITY: Derive a 32-byte key from the validated hex string.
// env.js guarantees this is a valid 64-character hex string (32 bytes).
const SECRET_KEY = Buffer.from(env.aesSecretKey, 'hex');

/**
 * Encrypts plaintext using AES-256-GCM.
 * Returns format: iv:authTag:ciphertext (all hex-encoded)
 * @param {string} text - Plaintext to encrypt
 * @returns {string|null} Encrypted string or original value if falsy
 */
export const encrypt = (text) => {
  if (!text) return text;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypts AES-256-GCM encrypted text.
 * Expects format: iv:authTag:ciphertext (all hex-encoded)
 * @param {string} text - Encrypted string to decrypt
 * @returns {string|null} Decrypted plaintext or original value if not in expected format
 */
export const decrypt = (text) => {
  if (!text) return text;

  const parts = text.split(':');
  if (parts.length !== 3) {
    // Not in encrypted format — return as-is for backward compatibility
    return text;
  }

  try {
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    // SECURITY: Log error without exposing decryption details to caller
    console.error('[EncryptionService] Decryption failed');
    return text;
  }
};

/**
 * Creates a SHA-256 hash of the input text.
 * Used for hashing tokens (password reset, email verification) before storage.
 * @param {string} text - Text to hash
 * @returns {string} Hex-encoded SHA-256 hash
 */
export const hashToken = (text) => {
  return crypto.createHash('sha256').update(text).digest('hex');
};
