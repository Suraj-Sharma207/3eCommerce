import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

// The key must be 32 bytes for AES-256
const SECRET_KEY = process.env.AES_SECRET_KEY || 'your-32-byte-aes-secret-key-here-!';

export const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = crypto.pbkdf2Sync(SECRET_KEY, salt, 100000, 32, 'sha512');
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Return the encrypted text along with salt, iv, and tag
  return Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]).toString('base64');
};

export const decrypt = (encryptedText) => {
  const buffer = Buffer.from(encryptedText, 'base64');
  
  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  
  const key = crypto.pbkdf2Sync(SECRET_KEY, salt, 100000, 32, 'sha512');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
