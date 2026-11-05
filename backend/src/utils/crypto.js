/**
 * Encryption Utilities (Facade)
 *
 * DEPRECATED: This module re-exports from encryptionService.js for backward compatibility.
 * New code should import directly from '../utils/encryptionService.js'.
 */
export { encrypt, decrypt, hashToken } from "./encryptionService.js";
