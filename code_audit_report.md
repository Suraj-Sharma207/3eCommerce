# 🔐 Full Code Audit Report — eCommerce Platform

> **Scope**: Backend (`src/`) + Frontend (`src/services/api.js`) | **Date**: 2026-07-03

---

## 🚨 CRITICAL Issues (Fix Immediately)

### C-1 — Real Credentials in `.env` (Secrets Leaked)
**File**: [.env](file:///c:/Users/Admin/Desktop/eCommerce/backend/.env)

```diff
- DATABASE_URL="postgresql://neondb_owner:npg_iKSPDY47GvNQ@..."  ← LIVE DB password
- AES_SECRET_KEY="3bd94b57f7acf8aa8a73dfaffa886fdc..."              ← LIVE encryption key
- CLOUDINARY_API_SECRET="hsQ6jQkssyN5_2vpiy4Wq0hY32k"              ← LIVE cloud secret
- SMTP_PASSWORD="fryf sncb ccxj ddmt"                               ← LIVE Gmail app password
- DEFAULT_ADMIN_PASSWORD="Suraj@12345"                              ← Admin password in plaintext
```

**Risk**: If this file is ever committed to git (`.gitignore` not checked here), ALL secrets are exposed. `.env.example` **also contains the real DATABASE_URL** — this is a definite leak.

**Action**:
1. Rotate ALL secrets immediately (DB password, Cloudinary, SMTP, AES key, JWT secret).
2. Fix `.env.example` to contain only placeholder values, not real credentials.
3. Verify `.gitignore` includes `.env`.

---

### C-2 — Weak JWT Secret with Hardcoded Fallback
**Files**: [jwt.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/utils/jwt.js) | [config/index.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/config/index.js)

```js
// jwt.js — Line 6
jwt.sign(payload, process.env.JWT_SECRET || 'secret', ...)
// config/index.js — Line 6
jwtSecret: process.env.JWT_SECRET || 'secret'
```

The fallback `'secret'` is a known, trivially guessable key. Also, the current `.env` value is the literal string `"your-jwt-secret-key"` — a placeholder, not a secret.

**Action**: Remove the `|| 'secret'` fallback. Throw a startup error if `JWT_SECRET` is missing or weak.

```js
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('FATAL: JWT_SECRET must be set and at least 32 characters.');
}
```

---

### C-3 — AES Key Fallback Silently Truncates / Uses Weak Default
**File**: [crypto.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/utils/crypto.js) — Line 7

```js
const SECRET_KEY = Buffer.from(
  process.env.AES_SECRET_KEY || 'your-32-byte-aes-secret-key-here-!', 
  'utf8'
).slice(0, 32); // ← silently truncates any key > 32 bytes
```

This silently accepts a weak default key with no warning, and **truncates** the key without any error — a key of `"your-32-byte-aes-secret-key-here-!"` would produce a broken/predictable AES key.

**Note**: There are **two separate crypto files** (`crypto.js` and `aes256.js`) with different encryption schemes (one uses PBKDF2+salt, one uses raw key slice). This inconsistency could cause decryption mismatches.

**Action**: Startup-fail if `AES_SECRET_KEY` is not set. Consolidate into one encryption utility.

---

## ⚠️ HIGH Severity Issues

### H-1 — Access Token Leaked in Response Body
**File**: [authController.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/controllers/authController.js) — Lines 41, 160

```js
// login (line 41)
return successResponse(res, 'Login successful', { user, token: accessToken }, 200);
// refresh (line 160)
return successResponse(res, 'Token refreshed successfully', { token: accessToken }, 200);
```

The `accessToken` is sent in the HTTP response body in addition to the `HttpOnly` cookie. A comment admits this is a "temporary backward compatibility" measure that was never removed.

**Risk**: Tokens in the response body can be read by JavaScript → stolen via XSS attacks. The `HttpOnly` cookie protection is nullified.

**Action**: Remove `token` from the response body. Rely exclusively on `HttpOnly` cookies.

---

### H-2 — Frontend Stores Token in `localStorage`
**File**: [frontend/src/services/api.js](file:///c:/Users/Admin/Desktop/eCommerce/frontend/src/services/api.js) — Lines 29–44

```js
const authStorage = localStorage.getItem('auth-storage');
token = parsed?.state?.token;
// ...
config.headers.Authorization = `Bearer ${token}`;
```

The frontend reads a JWT from `localStorage` and sends it as a `Bearer` token. `localStorage` is accessible by any JavaScript running on the page — XSS directly steals the token.

**Risk**: Critical — this completely bypasses the `HttpOnly` cookie security model set up on the backend.

**Action**: Remove the `localStorage` token logic. Since the backend already sets `HttpOnly` cookies and `withCredentials: true` is set on the Axios instance, the cookies will be sent automatically. The `Authorization` header injection is redundant and dangerous.

---

### H-3 — `sameSite: 'Lax'` on Cookies (CSRF Risk for Cross-Site POSTs)
**File**: [authController.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/controllers/authController.js) — Lines 29, 34

```js
res.cookie('accessToken', accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Lax',  // ← allows cross-site top-level navigation POSTs
  ...
});
```

`SameSite: Lax` protects against most CSRF but still allows cookies to be sent on cross-site GET requests that result in navigation. For an API that does not do GET-based mutations, `Strict` would be safer. At minimum, a CSRF token should be validated for state-changing endpoints.

**Action**: Change to `sameSite: 'Strict'` or implement CSRF token validation (e.g., double-submit cookie pattern).

---

### H-4 — `secure` Cookie Flag Disabled in Development
**File**: [authController.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/controllers/authController.js) — Lines 28, 35

```js
secure: process.env.NODE_ENV === 'production',
```

The server is running on `PORT=5000` with no `NODE_ENV` set in the `.env`. If `NODE_ENV` is `undefined`, `secure` is `false` — cookies can be transmitted over HTTP. This is fine for local dev, but a risk if accidentally deployed without `NODE_ENV=production`.

**Action**: Add `NODE_ENV=production` to production deployment scripts. Consider throwing a startup warning if `NODE_ENV` is not explicitly set.

---

### H-5 — `x-no-compression` Header Honored Without Authentication
**File**: [app.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/app.js) — Lines 48–54

```js
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false; // ← Any client can disable compression
    }
    return compression.filter(req, res);
  }
}));
```

Any unauthenticated client can send `x-no-compression: 1` to disable compression on responses. While not critical, this can be abused to increase server bandwidth usage.

**Action**: Remove this custom header check, or restrict it to internal/admin requests only.

---

### H-6 — `req.connection.remoteAddress` Used as IP (Deprecated)
**Files**: [authController.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/controllers/authController.js) — Lines 20, 140 | [errorMiddleware.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/middleware/errorMiddleware.js) — Line 15 | [settingsController.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/controllers/settingsController.js) — Line 61

```js
ip: req.ip || req.connection.remoteAddress
```

`req.connection` is deprecated in Node.js ≥ v14 and was fully removed in later versions. If `req.ip` is already provided by Express (which it is, as long as `trust proxy` is set correctly), the fallback is redundant and could throw.

**Action**: Remove `req.connection.remoteAddress` fallbacks everywhere. Use only `req.ip`.

---

## 🟡 MEDIUM Severity Issues

### M-1 — Error Message Leaks Internal Error Details in Admin Controller
**File**: [adminController.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/controllers/adminController.js) — Lines 19, 104, 134, etc.

```js
// In getDashboardAnalytics, getRevenueAnalytics, etc.
return res.status(500).json({ success: false, message: error.message });
```

These handlers bypass the centralized `errorHandler` middleware and expose raw `error.message` to the client — which could contain Prisma details, SQL strings, or stack info.

**Action**: Remove the inline `res.status(500).json(...)` responses and call `next(error)` instead, letting the central `errorHandler` sanitize the response.

---

### M-2 — Duplicate `crypto.js` and `aes256.js` — Inconsistent Encryption
**Files**: [utils/crypto.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/utils/crypto.js) | [utils/aes256.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/utils/aes256.js)

Two separate AES-256-GCM implementations exist side-by-side:
- `crypto.js`: Uses raw 32-byte key slice, no salt, IV + authTag + ciphertext colon-delimited string.
- `aes256.js`: Uses PBKDF2 with random salt (100,000 iterations), output is base64 blob.

If different parts of the code use different utilities to encrypt/decrypt the same data, decryption will silently fail or return garbage. `aes256.js` is the more secure implementation.

**Action**: Deprecate `crypto.js`. Migrate all usages to `aes256.js`. Add a clear migration note.

---

### M-3 — Password Reset Token Stored as Plaintext in Database
**File**: [authService.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/services/authService.js) — Lines 278, 302

```js
await userRepository.update(user.id, {
  resetPasswordToken: resetToken,    // ← stored as plain hex string
```

If the `user` table is ever read (DB compromise, SQL injection, insecure backup), the reset token is directly usable to hijack any account.

**Action**: Store `crypto.createHash('sha256').update(resetToken).digest('hex')` in the DB. The same pattern you already use correctly for refresh tokens (line 127).

---

### M-4 — Email Verification Token Also Stored in Plaintext
**File**: [authService.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/services/authService.js) — Lines 26, 30–37

```js
const verificationToken = crypto.randomBytes(32).toString('hex');
const user = await userRepository.create({
  ...
  verificationToken,   // ← plaintext in DB
```

Same issue as M-3.

**Action**: Store `sha256(verificationToken)` in DB, compare hash on verification.

---

### M-5 — No Input Body Size Limit Configured
**File**: [app.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/app.js) — Lines 79–80

```js
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

No `limit` is specified. Express defaults to `100kb` for JSON, but this should be explicit. For upload routes, large file payloads could bypass this.

**Action**:
```js
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
```

---

### M-6 — Rate Limiter Skips OPTIONS but Uses In-Memory Store by Default
**File**: [rateLimiter.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/middleware/rateLimiter.js)

The rate limiter uses the default in-memory store. In a multi-process or multi-instance deployment, each process has its own counter — the effective limit is multiplied by the number of processes. An attacker can send `N × limit` requests without triggering rate limiting.

**Action**: Configure a Redis store using `rate-limit-redis` when `REDIS_URL` is available.

---

### M-7 — `bulkDeleteProducts` Lacks a Max Array Size Limit
**File**: [adminController.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/controllers/adminController.js) — Lines 253–270

```js
const { productIds } = req.body;
if (!Array.isArray(productIds) || productIds.length === 0) { ... }
// No upper limit on array size!
const result = await productService.bulkDeleteProducts(productIds);
```

An admin could accidentally or maliciously submit an array with thousands of IDs, causing a massive DB transaction.

**Action**: Add a cap: `if (productIds.length > 500) return errorResponse(...)`.

---

### M-8 — `REDIS_KEYS` Pattern Scan in Production
**File**: [cacheService.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/services/cacheService.js) — Line 179

```js
const keys = await redisClient.keys(pattern);
```

`KEYS` is a blocking O(N) Redis command. In production with large key sets, this blocks the Redis event loop for all other clients.

**Action**: Replace with `SCAN` using cursor-based iteration, or use `ioredis` with pattern scanning.

---

### M-9 — Admin `test-admin` Debug Endpoint Left in Production Code
**File**: [adminRoutes.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/routes/adminRoutes.js) — Lines 64–67

```js
// Temporary test endpoint
router.get('/test-admin', (req, res) => {
  res.json({ user: req.user }); // ← Exposes full user object including role, id, email
});
```

A debug endpoint that dumps the full authenticated user object. It's behind `protect` + `authorize('ADMIN')`, but exposes all user fields in a non-standard way.

**Action**: Delete this endpoint entirely before any staging/production deployment.

---

### M-10 — HTTP Request Logger Logs All URLs (Including Sensitive Paths)
**File**: [app.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/app.js) — Lines 41–44

```js
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.originalUrl}`);
  next();
});
```

This logs every URL including `/api/auth/reset-password?token=abc123...`. Password reset tokens could appear in server logs.

**Action**: Sanitize sensitive path parameters before logging, or use a structured logger (e.g., `pino`) that redacts known sensitive fields.

---

### M-11 — `logout` Does Not Force-Clear Cookies if No Refresh Token Present
**File**: [authController.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/controllers/authController.js) — Lines 59–81

```js
async logout(req, res, next) {
  try {
    if (req.cookies && req.cookies.refreshToken) {
      await authService.logout(req.cookies.refreshToken); // ← Only called if token exists
    }
    // Cookies are still cleared below — that's good
```

If the refresh token cookie is missing (e.g., already expired), the session is not invalidated server-side but the DB session record remains active. A stale session could be reused with an old refresh token from another device.

**Note**: This is partially mitigated by token version checks. Still worth ensuring session cleanup is more robust.

---

## 🔵 LOW / Code Quality Issues

### L-1 — `loginSchema` Uses `passwordValidation` with Complexity Rules
**File**: [authValidation.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/validations/authValidation.js) — Line 22

```js
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format.'),
    password: passwordValidation, // ← requires uppercase, lowercase, number, special char
  }),
});
```

Password complexity validation on the **login** endpoint is incorrect. Users with older passwords that don't meet the current complexity rules cannot log in. Login should only validate that a password was provided (`z.string().min(1)`).

**Action**: Change `loginSchema.password` to `z.string().min(1, 'Password is required.')`.

---

### L-2 — Dynamic `import()` Inside Request Handlers (Performance)
**Files**: [adminController.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/controllers/adminController.js) — Lines 211, 226, 241, 257, 265 | [orderService.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/services/orderService.js) — Line 118

```js
const { default: orderService } = await import('../services/orderService.js');
const { default: productService } = await import('../services/productService.js');
```

Dynamic imports inside request handlers add latency on the first call (module loading) and cause unnecessary re-evaluation. These are static dependencies — they should be top-level imports.

**Action**: Move all `import()` calls to static top-level `import` statements.

---

### L-3 — `gracefulShutdown` Force-Exit Timer is Too Short (1.5s)
**File**: [server.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/server.js) — Lines 28–32

```js
setTimeout(() => {
  console.warn('[Server] Graceful shutdown timed out. Force exiting...');
  process.exit(0);
}, 1500); // ← 1.5 seconds
```

1.5 seconds may not be enough for in-flight database transactions or email operations to complete, leading to data corruption on deploy/restart.

**Action**: Increase to at least `10000` ms (10 seconds) for a production app with DB transactions.

---

### L-4 — `process.exit(0)` on Error (Masking Exit Code)
**File**: [server.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/server.js) — Lines 31, 45

```js
process.exit(0); // ← Exit code 0 = success, even on force timeout
```

Process managers (PM2, systemd, Docker) use exit codes to determine if a process crashed. Exit code `0` means "clean exit" — the manager will not restart a crashed process.

**Action**: Change the force-exit timeout to `process.exit(1)` to signal abnormal termination.

---

### L-5 — `cookieController.js` Exists — Unclear Purpose
**File**: [controllers/cookieController.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/controllers/cookieController.js)

Cookie management in this app is already handled in `authController.js`. A separate `cookieController.js` creates ambiguity about the authoritative location for cookie logic.

**Action**: Review if `cookieController.js` is used in any route. If not, delete it.

---

### L-6 — Audit Log `oldValue` for Security Settings is Always `{}`
**File**: [securityAdminRoutes.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/routes/securityAdminRoutes.js) — Lines 29–37

```js
await prisma.auditLog.create({
  data: {
    adminName: req.user.name,
    section: 'SECURITY_SETTINGS',
    oldValue: {},   // ← Always empty! No diff possible.
    newValue: updatedSettings,
    ipAddress: req.ip
  }
});
```

Audit logs are useless for security settings changes because the `oldValue` is always `{}`. You cannot reconstruct what changed.

**Action**: Fetch `oldValue` from the DB before updating:
```js
const oldSettings = await securitySettingsService.getSettings();
```

---

### L-7 — Frontend Reads Token from `localStorage` Even When Cookie Auth Is Used
**File**: [frontend/src/services/api.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/services/api.js) — Lines 25–45

As noted in H-2, the frontend redundantly reads from `localStorage` and sends an `Authorization: Bearer` header **in addition to** the cookie. If the backend prefers cookies (which it does — `authMiddleware.js` checks `req.cookies.accessToken` first), the `Bearer` header is redundant and a security risk.

**Action**: Remove the entire localStorage token read and Authorization header injection from the request interceptor. Cookie-based auth is sufficient.

---

### L-8 — `compress` Filter Relies on Truthy Header Value (Not Validated)
**File**: [app.js](file:///c:/Users/Admin/Desktop/eCommerce/backend/src/app.js) — Line 49

```js
if (req.headers['x-no-compression']) {
  return false;
}
```

Any value for this header (even `x-no-compression: false`) will disable compression due to JavaScript's truthy evaluation.

**Action**: If keeping this feature: `if (req.headers['x-no-compression'] === 'true') { return false; }`

---

## ✅ What Is Done Well

| Area | Assessment |
|------|-----------|
| **Refresh Token Rotation** | Correctly implemented — each refresh generates a new token and invalidates the old one |
| **Password Hashing** | `bcrypt` with 10 salt rounds — correct |
| **Token Version Invalidation** | `tokenVersion` check in `authMiddleware.js` enables server-side JWT invalidation |
| **Role Authorization** | `authorize()` middleware + `SUPER_ADMIN` inheritance is clean |
| **Input Validation (Zod)** | Auth routes use schema validation, good coverage |
| **Error Sanitization** | `errorHandler` strips Prisma/DB internals from client responses |
| **Account Lockout** | Configurable failed login limit with lockout duration |
| **Rate Limiting** | Granular per-route rate limiters in place |
| **Compression** | Response compression enabled |
| **Helmet** | Security headers via `helmet()` |
| **CORS Whitelist** | Dynamic origin checking against `FRONTEND_URL` list |
| **Graceful Shutdown** | Signal handlers for `SIGTERM`, `SIGINT`, `SIGUSR2` |
| **AES-GCM Auth Tags** | Both crypto utilities use GCM with authentication tags — good |
| **Session Management** | DB-backed sessions, terminatable by admin |
| **Luhn Validation** | Card number Luhn check in checkout — correct |
| **File Upload Filtering** | MIME type checking + file size limits on all upload middlewares |

---

## 📋 Priority Fix Order

| Priority | ID | Issue | File |
|----------|----|-------|------|
| 🔴 P0 | C-1 | Rotate all leaked secrets NOW | `.env`, `.env.example` |
| 🔴 P0 | C-2 | Remove JWT `'secret'` fallback | `jwt.js`, `config/index.js` |
| 🔴 P0 | H-2 | Remove `localStorage` token storage | `frontend/api.js` |
| 🔴 P0 | H-1 | Remove token from response body | `authController.js` |
| 🟠 P1 | C-3 | Fix AES key fallback + startup validation | `crypto.js`, `aes256.js` |
| 🟠 P1 | M-3 | Hash password reset tokens before DB storage | `authService.js` |
| 🟠 P1 | M-4 | Hash email verification tokens before DB storage | `authService.js` |
| 🟠 P1 | L-1 | Fix `loginSchema` to not enforce password complexity | `authValidation.js` |
| 🟡 P2 | H-3 | Consider `SameSite: Strict` cookies | `authController.js` |
| 🟡 P2 | M-1 | Fix admin controller raw error leaks | `adminController.js` |
| 🟡 P2 | M-9 | Delete debug `/test-admin` endpoint | `adminRoutes.js` |
| 🟡 P2 | M-5 | Set explicit JSON body size limits | `app.js` |
| 🟡 P2 | L-6 | Fix audit log `oldValue` for security settings | `securityAdminRoutes.js` |
| 🟢 P3 | M-2 | Consolidate dual crypto utilities | `crypto.js` / `aes256.js` |
| 🟢 P3 | M-6 | Use Redis store for rate limiter | `rateLimiter.js` |
| 🟢 P3 | M-8 | Replace `KEYS` with `SCAN` in Redis | `cacheService.js` |
| 🟢 P3 | M-7 | Cap `bulkDeleteProducts` array size | `adminController.js` |
| 🟢 P3 | L-2 | Replace dynamic `import()` with static imports | `adminController.js` |
| 🟢 P3 | L-3 | Increase graceful shutdown timeout | `server.js` |
| 🟢 P3 | L-4 | Fix `process.exit(0)` on forced shutdown | `server.js` |
| 🟢 P3 | H-6 | Remove deprecated `req.connection.remoteAddress` | Multiple files |
| 🟢 P3 | M-10 | Sanitize sensitive URLs from request logger | `app.js` |
