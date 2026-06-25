import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const ALGORITHM = 'aes-256-gcm';
// Ensure the secret key is exactly 32 bytes for AES-256
const SECRET_KEY = Buffer.from(process.env.AES_SECRET_KEY || 'your-32-byte-aes-secret-key-here-!', 'utf8').slice(0, 32);

export const encrypt = (text) => {
  if (!text) return text;
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

export const decrypt = (text) => {
  if (!text) return text;
  
  // Try to parse the format iv:authTag:encrypted
  const parts = text.split(':');
  if (parts.length !== 3) {
    // If not encrypted or old format, return as is (for backwards compatibility if any)
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
    console.error('Decryption failed:', err);
    return text;
  }
};
