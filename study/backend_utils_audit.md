# Backend Utilities (`backend/src/utils`) Technical Audit

This document provides a comprehensive technical audit of the helper and utility modules located in the [utils](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/utils) directory of the backend application. These utilities power critical security, cryptography, validation, and middleware responses throughout the application.

---

## 1. Directory Overview & Architecture

The `backend/src/utils` folder contains stateless, reusable utility functions:

```
backend/src/utils/
├── aes256.js             # PBKDF2-derived AES-256-GCM Encryption (Base64 output)
├── crypto.js             # Static-key AES-256-GCM Encryption (Colon-separated hex output)
├── bcrypt.js             # Asynchronous Password Hashing & Verification (bcrypt)
├── jwt.js                # JSON Web Token signing & verification wrappers
├── productValidation.js  # Schema & input checks for Products CRUD
└── response.js           # Standardized API response format helpers
```

---

## 2. Cryptographic Utilities Detail

The codebase contains two implementations of Symmetric AES-256-GCM (Galois/Counter Mode) encryption. 

### A. PBKDF2-derived Symmetric Encryption: `aes256.js`
- **File Link**: [aes256.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/utils/aes256.js)
- **Implementation**:
  - Uses `crypto.randomBytes(64)` to generate a cryptographically strong pseudo-random salt.
  - Derives a 32-byte key using PBKDF2 key derivation (`crypto.pbkdf2Sync`) with `100,000` iterations, SHA-512 hashing, and a base key (`process.env.AES_SECRET_KEY`).
  - Encrypts using the derived key and a 16-byte random IV.
  - Packs the result into a single Base64 string by concatenating: `[salt (64B), iv (16B), authTag (16B), ciphertext]`.
- **Decryption**:
  - Decodes base64 payload.
  - Extracts the header parts by byte index using `buffer.subarray`.
  - Re-derives the key with the exact same salt and iteration count.
  - Deciphers and verifies the authentication tag (`decipher.setAuthTag(tag)`).

### B. Standard Symmetric Encryption: `crypto.js`
- **File Link**: [crypto.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/utils/crypto.js)
- **Implementation**:
  - Uses the base key directly (sliced to 32 bytes to satisfy AES-256 constraints).
  - Encrypts using a 16-byte random IV.
  - Outputs a colon-separated Hex string: `${iv}:${authTag}:${ciphertext}`.
- **Usage**: Used dynamically in `settingsService.js` for encrypting payment keys (Stripe, Razorpay) and system SMTP configuration passwords.

### Comparison Table

| Property | `aes256.js` (PBKDF2-derived) | `crypto.js` (Standard) |
| :--- | :--- | :--- |
| **Key Derivation** | PBKDF2 with 100k iterations of SHA-512 | Direct slice of raw environment key |
| **Output Format** | Base64 binary buffer container | Colon-separated hex string |
| **Key Brute Force Resistance** | Extremely High (PBKDF2 stretches base key) | Normal (depends directly on secret key strength) |
| **Performance Overhead** | Higher (due to key derivation loops) | Instantaneous |
| **Primary Use-Case** | High-security payload transit | Dynamic runtime config decryption |

---

## 3. Authentication & Hashing Utilities

### A. Password Hashing: `bcrypt.js`
- **File Link**: [bcrypt.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/utils/bcrypt.js)
- **Implementation**:
  - Leverages the native C++-bound `bcrypt` module.
  - Configures `SALT_ROUNDS = 10`.
  - Exposes async `hashPassword` and `comparePassword` functions.
- **Why**: Hashing passwords using Bcrypt uses a key-derivation function based on the Blowfish cipher, making it computationally expensive and highly resistant to GPU/ASIC-accelerated brute-force attacks.

### B. JWT Lifecycle Helpers: `jwt.js`
- **File Link**: [jwt.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/utils/jwt.js)
- **Implementation**:
  - Wraps the `jsonwebtoken` module's `sign` and `verify` operations.
  - Generates tokens using `process.env.JWT_SECRET` (falls back to a default `'secret'` in non-prod).
  - Configures token expiry (defaulting to `1d`).

---

## 4. Validation & API formatting Helpers

### A. Product Validation Schema: `productValidation.js`
- **File Link**: [productValidation.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/utils/productValidation.js)
- **Implementation**:
  - Evaluates names, descriptions, categories, prices, discounts, and inventory levels manually.
  - Uses Regex validations to ensure product names and brand strings contain only permitted characters (alphanumeric, spaces, and simple punctuation), preventing database bloat and injection attempts.
  - Parses and validates image URLs using `new URL()` checking, validating path suffixes and hostname matches for trusted image CDNs (e.g., Cloudinary, Unsplash).

### B. Standard API Response Formatter: `response.js`
- **File Link**: [response.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/utils/response.js)
- **Implementation**:
  - Wraps HTTP responses into a structured JSON envelope.
  - **Success Payload**: `{ success: true, message, data }`
  - **Error Payload**: `{ success: false, message, errors }`
- **Why**: Keeps responses consistent, making frontend deserialization simpler.

---

## 5. Technical Interview Questions & Expected Answers

### Q1: What is the purpose of GCM mode in AES-256, and why is it preferred over CBC mode?
- **Expected Answer**: AES-256-GCM is an **Authenticated Encryption with Associated Data (AEAD)** cipher. Unlike CBC mode, which only encrypts data, GCM provides both confidentiality and integrity verification using an authentication tag. This tag prevents ciphertext tampering attacks (like padding oracle attacks).

### Q2: Why does `bcrypt` require `compare` instead of direct equality comparison on database strings?
- **Expected Answer**: Bcrypt salts each hashed password individually. The salt is generated randomly and embedded directly in the resulting hash string. The `compare` function extracts this salt from the database hash and applies it to the plaintext password during verification. Additionally, `compare` uses a constant-time comparison algorithm to prevent timing attacks.

### Q3: Why do we slice the key to 32 bytes in `crypto.js`?
- **Expected Answer**: AES-256 requires a key of exactly 256 bits (32 bytes). Slicing ensures the key length matches this requirement regardless of the length of the string provided in `AES_SECRET_KEY`, avoiding runtime initialization errors.
