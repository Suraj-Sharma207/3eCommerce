# Enterprise Full Stack Architecture Audit Report
## PRIYAL | Home Appliances Pvt Ltd. — eCommerce Platform

---

> **Classification:** Internal Architecture Document  
> **Prepared For:** Engineering Manager Technical Review  
> **Scope:** Full-stack production-grade audit across frontend, backend, database, security, and performance layers  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Phase 1 — Project Overview](#phase-1--project-overview)
3. [Phase 2 — Folder Structure Audit](#phase-2--folder-structure-audit)
4. [Phase 3 — Frontend Architecture](#phase-3--frontend-architecture)
5. [Phase 4 — State Management](#phase-4--state-management)
6. [Phase 5 — Backend Architecture](#phase-5--backend-architecture)
7. [Phase 6 — Database Audit](#phase-6--database-audit)
8. [Phase 7 — Authentication Architecture](#phase-7--authentication-architecture)
9. [Phase 8 — API Audit](#phase-8--api-audit)
10. [Phase 9 — Admin Architecture](#phase-9--admin-architecture)
11. [Phase 10 — Customer Architecture](#phase-10--customer-architecture)
12. [Phase 11 — UI Architecture](#phase-11--ui-architecture)
13. [Phase 12 — Performance](#phase-12--performance)
14. [Phase 13 — Security](#phase-13--security)
15. [Phase 14 — Library Audit](#phase-14--library-audit)
16. [Phase 15 — JavaScript Concepts Audit](#phase-15--javascript-concepts-audit)
17. [Phase 16 — Complete User Flows](#phase-16--complete-user-flows)
18. [Phase 17 — Engineering Decisions](#phase-17--engineering-decisions)
19. [Phase 18 — Manager Q&A Preparation](#phase-18--manager-qa-preparation)
20. [Strengths](#strengths)
21. [Areas for Future Improvement](#areas-for-future-improvement)

---

## Executive Summary

**PRIYAL | Home Appliances Pvt Ltd.** is a full-stack, production-grade B2C eCommerce platform built for a home appliances retail business. The platform handles the complete lifecycle of customer shopping — from product discovery through purchase, order tracking, and admin management.

The system is built on a **decoupled, layered monolith** architecture: a React (Vite) SPA frontend communicates over REST APIs with an Express.js backend, backed by a PostgreSQL relational database managed via the Prisma ORM.

The codebase demonstrates enterprise software engineering practices including:
- **Repository Pattern** for data access separation
- **Service Layer** for encapsulated business logic
- **JWT + Refresh Token rotation** with database-backed sessions
- **Optimistic UI updates** with automatic rollback on failures
- **Server-side filtering, sorting, and pagination** on all admin list views
- **AbortController + Debouncing** for request cancellation and performance
- **Granular rate limiting** per route category
- **Audit logging** for all admin actions
- **Role-Based Access Control** (CUSTOMER / ADMIN / SUPER_ADMIN)
- **Cloud image management** via Cloudinary with server-side Multer streaming

---

## Phase 1 — Project Overview

### Project Name
**PRIYAL | Home Appliances Pvt Ltd. — eCommerce Platform**

### Project Purpose
A full-stack online retail platform enabling customers to browse, wishlist, purchase, and track home appliances, while giving administrators complete control over products, orders, customers, promotions, and site settings.

### Business Problem Solved
Eliminates the need for a physical-only retail operation by providing:
- A 24/7 self-service product catalog with filtering and search
- An automated checkout and order pipeline
- A centralized admin panel for business operations without requiring external SaaS tools
- An email notification system for order lifecycle events
- Promotional campaign management to drive sales

### Target Users

| Role | Description |
|------|-------------|
| **Guest** | Unauthenticated visitors who can browse products and view catalog |
| **Customer** | Registered users who can purchase, wishlist, manage orders/addresses |
| **Admin** | Staff who manage products, orders, customers, and platform settings |
| **Super Admin** | Has all Admin privileges plus elevated access |

### Core Modules

1. **Authentication** — Register, Login, JWT, Refresh Token, Email Verification, Password Reset
2. **Products** — Full CRUD, multi-image upload, categories, filtering, search
3. **Cart** — Persistent server-side cart with optimistic UI
4. **Wishlist** — Toggle-based wishlist with optimistic UI
5. **Orders** — Checkout, order lifecycle management, ACID transactions
6. **Promotions & Offers** — Campaign creation (discount types, coupon codes, flash sales)
7. **Admin Dashboard** — KPI analytics, charts, inventory alerts
8. **Customer Management** — Admin view of all customers with enable/disable
9. **Settings System** — Configurable store, shipping, payment, SMTP, security, and notifications
10. **Branding** — Dynamic logo, platform name, colors, and email branding
11. **Email System** — Transactional emails via SMTP using Handlebars templates
12. **Security** — Audit logs, session management, rate limiting, account lockout

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                             │
│           React SPA (Vite) — Port 5173                      │
│  Components → Stores (Zustand) → Services (Axios) → API    │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST/JSON over HTTP
┌──────────────────────▼──────────────────────────────────────┐
│                    SERVER LAYER                             │
│             Express.js — Port 5000                          │
│  Helmet → CORS → RateLimit → Router → Controller →         │
│  Service → Repository → Prisma ORM                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ SQL via Prisma
┌──────────────────────▼──────────────────────────────────────┐
│                  DATABASE LAYER                             │
│              PostgreSQL (Neon Serverless)                   │
│  22+ tables: Users, Products, Orders, Sessions, Logs...    │
└──────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│               EXTERNAL SERVICES                             │
│  Cloudinary (Images) │ SMTP/Nodemailer (Email)              │
└──────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend Framework | React 18 | Component model, ecosystem, SPA rendering |
| Frontend Bundler | Vite | Fastest dev server (HMR), ES Module native |
| Styling | Tailwind CSS | Utility-first, design token system |
| Animations | Framer Motion | Declarative, hardware-accelerated animations |
| State Management | Zustand | Minimal boilerplate, no Provider hell |
| HTTP Client | Axios | Interceptors, request cancellation, structured errors |
| Backend Framework | Express.js | Minimal, flexible, huge ecosystem |
| ORM | Prisma | Type-safe, schema-first, auto-migrations |
| Database | PostgreSQL | Relational integrity, ACID compliance, JSON columns |
| Authentication | JWT + bcrypt | Stateless auth + secure password hashing |
| File Uploads | Multer + Cloudinary | Stream directly to CDN, avoid local disk |
| Email | Nodemailer + Handlebars | SMTP-agnostic, template-driven emails |
| Validation | Zod | Schema-first runtime validation |
| Icons | Lucide React | Lightweight, tree-shakeable icon set |
| Notifications | React Hot Toast | Non-blocking, accessible toast notifications |
| Phone Input | react-phone-number-input | E.164 format, international flag picker |

---

## Phase 2 — Folder Structure Audit

### Root (`/eCommerce`)

```
eCommerce/
├── frontend/      # React SPA (Vite)
├── backend/       # Express.js REST API
├── docs/          # Documentation
├── .agents/       # AI agent skills (Neon, Neon-postgres)
├── package.json   # Workspace root package
└── .gitignore
```

**Why this structure:** Monorepo-style co-location without a monorepo manager. Both `frontend/` and `backend/` are independently runnable Node.js projects sharing only the filesystem. Avoids microservice overhead while keeping teams separate.

---

### Backend (`/backend/src`)

```
backend/
└── src/
    ├── app.js            # Express application setup (middleware, routes)
    ├── server.js         # HTTP server bootstrap (port binding)
    ├── config/           # Environment/config readers
    ├── controllers/      # HTTP request handlers (thin, delegate to services)
    ├── services/         # Business logic layer
    ├── repositories/     # Data access layer (Prisma queries)
    ├── routes/           # Express Router definitions
    ├── middleware/        # Auth, Rate Limiting, Upload, Validation, Error
    ├── validations/      # Zod schemas for request body validation
    ├── email/            # Email templates, events, and SMTP transport
    ├── lib/              # Prisma client singleton
    ├── utils/            # Helper functions (JWT, bcrypt, response, etc.)
    └── scripts/          # One-off admin seed scripts
```

| Folder | Why It Exists | Responsibility |
|--------|--------------|----------------|
| `controllers/` | Separates HTTP concerns from business logic | Parse request, call service, send HTTP response |
| `services/` | Contains business logic independent of HTTP | Enforce rules, orchestrate repositories, emit events |
| `repositories/` | Isolates Prisma/SQL from services | All database queries, no business logic |
| `middleware/` | Cross-cutting concerns applied per route | Auth, authorization, upload, rate limiting, error handling |
| `routes/` | Declares URL structure and middleware chains | Map URLs to controller methods with middleware |
| `validations/` | Input validation schemas | Zod schemas — validate before hitting the controller |
| `email/` | Decoupled email subsystem | Templates (Handlebars), EventEmitter-based triggers |
| `lib/` | Shared singletons | `prisma.js` — single PrismaClient instance |
| `utils/` | Pure utility functions | JWT sign/verify, bcrypt hash/compare, standard response |

---

### Frontend (`/frontend/src`)

```
frontend/src/
├── App.jsx          # Root component — loads BrowserRouter + AppRoutes
├── main.jsx         # React DOM entry point
├── index.css        # Global CSS reset and Tailwind directives
├── routes/          # AppRoutes.jsx — all route declarations
├── pages/           # One folder per page/domain
├── components/      # Reusable components (admin, ui, layout, nav...)
├── store/           # All Zustand stores (one per domain)
├── services/        # Axios API wrappers per domain
├── hooks/           # Custom React hooks
├── providers/       # React Context providers (if any)
├── utils/           # Pure helper functions (validators, parsers)
├── constants/       # Static data (categories, enums)
├── data/            # Static mock/seeded data for UI
└── theme/           # Design system tokens (typography, colors, shadows, spacing)
```

| Folder | Why It Exists | Responsibility |
|--------|--------------|----------------|
| `pages/` | Organizes views by domain | Full-screen views composed from components |
| `components/` | Reusable UI across pages | Buttons, Inputs, Cards, Tables, Drawers, Modals |
| `store/` | Global state — one file per domain | Zustand stores for auth, cart, products, etc. |
| `services/` | API layer | All Axios calls — wraps `api.js` with resource endpoints |
| `hooks/` | Reusable stateful logic | `useAdminFilters`, `useIntersectionObserver` |
| `theme/` | Design tokens | Colors, typography, shadows, spacing, gradients |
| `utils/` | Shared pure functions | Form validators, error parsers |

---

## Phase 3 — Frontend Architecture

### React Architecture
The app is a **Single Page Application (SPA)** using React 18 with a component-based, domain-organized architecture. All routing is client-side using React Router v6.

### Vite
Vite is used as the build tool and dev server. It leverages native ES Modules for instant server startup and hot module replacement (HMR) without bundling. In production, it uses Rollup for optimized code splitting.

### Routing Architecture (`AppRoutes.jsx`)

The routing system has three distinct groups:

```
Routes
├── PublicLayout (Navbar + Footer)
│   ├── / (HomePage)
│   ├── /about
│   ├── /sale
│   ├── /products
│   ├── /products/:id
│   ├── /cart
│   ├── /order-success/:id
│   └── CustomerProtectedRoute (requires login)
│       ├── /checkout
│       ├── /profile
│       ├── /addresses
│       ├── /orders
│       ├── /orders/:id
│       └── /settings
│
├── AuthLayout (centered card layout)
│   └── GuestProtectedRoute (redirects if already logged in)
│       ├── /login
│       ├── /admin/login
│       └── /register
│
└── AdminLayout (sidebar + top bar)
    ├── /admin/dashboard
    ├── /admin/products
    ├── /admin/orders
    ├── /admin/customers
    ├── /admin/offers
    ├── /admin/settings
    ├── /admin/settings/:tab
    ├── /admin/homepage
    └── /admin/profile
```

**All routes are code-split** using `React.lazy()` and wrapped in `Suspense`, so each page is a separate chunk that loads only on demand, dramatically reducing initial bundle size.

**Protected Routes Implementation:**
- `CustomerProtectedRoute` — reads `useAuthStore`. If not authenticated, redirects to `/login`.
- `GuestProtectedRoute` — reads `useAuthStore`. If already authenticated, redirects to `/`.
- Admin routes inside `AdminLayout` perform a role check and redirect unauthenticated or non-admin users away.

### Component Hierarchy

```
App.jsx
  └── BrowserRouter
        └── AppRoutes.jsx
              ├── PublicLayout
              │     ├── Navbar (navigation, cart badge, wishlist drawer trigger)
              │     └── <Outlet /> → page components
              ├── AuthLayout (centered card wrapper)
              │     └── <Outlet /> → LoginPage / RegisterPage
              └── AdminLayout (sidebar navigation)
                    └── <Outlet /> → admin page components
```

### Data Flow (Full Stack)

```
User Action (Click/Input)
        ↓
React Component Event Handler
        ↓
Zustand Store Action (e.g., cartStore.addToCart)
        ↓
Axios Request via api.js (with JWT in Authorization header)
        ↓
Express Middleware Chain (Helmet → CORS → Rate Limit → Auth → Role)
        ↓
Controller (parse params, call service)
        ↓
Service (business logic, validation, orchestration)
        ↓
Repository (Prisma query)
        ↓
PostgreSQL (SQL execution)
        ↓
Prisma mapped response
        ↓
Service returns to Controller
        ↓
Controller sends JSON response
        ↓
Axios response interceptor
        ↓
Zustand set() updates global state
        ↓
React re-renders subscribed components
        ↓
UI reflects updated state
```

---

## Phase 4 — State Management

### Zustand Architecture

Zustand is a minimal, hooks-based state management library. The project uses **one store per domain**, with no Provider tree. Stores are plain JavaScript modules exporting a `create()` hook. Components subscribe only to the slice of state they need.

### Store Separation Rationale

| Store | Domain | Why Separate |
|-------|--------|-------------|
| `authStore` | Authentication | Persisted to localStorage; sensitive, isolated |
| `cartStore` | Shopping Cart | Requires debouncing, AbortController, per-item loading |
| `wishlistStore` | Wishlist | Per-product request locks; drawer UI state |
| `productStore` | Products (Admin+Customer) | AbortController, complex filter state, pagination |
| `adminStore` | Admin Dashboard + Orders | 5-min cache, request deduplication |
| `customerStore` | Admin Customer Management | AbortController, pagination |
| `promotionStore` | Offers/Promotions | Admin CRUD for campaigns |
| `settingsStore` | Platform Settings | Domain-scoped save/load per settings category |
| `brandingStore` | Branding Config | Fetched once, used globally across navbar/emails |
| `userStore` | User Profile | Avatar, personal info — separate from auth |
| `addressStore` | Addresses | CRUD for saved delivery addresses |
| `orderStore` | Customer Orders | Order history, detail view |
| `categoryStore` | Product Categories | Used in filters, fetched once |
| `paymentStore` | Checkout Payment | Payment method selection during checkout |
| `confirmStore` | Global Confirm Dialog | Shared dialog trigger across all delete actions |
| `uiStore` | Global UI toggles | Miscellaneous UI flags |

---

### Individual Store Profiles

#### `authStore.js`
- **Purpose:** Login, register, logout, token refresh, session hydration
- **State:** `user`, `token`, `isAuthenticated`, `isLoading`, `error`, `hasCheckedAuth`
- **Key Feature:** `checkAuth()` uses a module-level Promise to **deduplicate parallel calls** — if multiple components call `checkAuth()` simultaneously, only one API request is made
- **Persistence:** `user`, `token`, `isAuthenticated` are persisted to `localStorage` via `zustand/middleware/persist` under the key `auth-storage`
- **Flow:** Login → api.post → `{ user, token }` → set state → localStorage persisted

#### `cartStore.js`
- **Purpose:** Manage server-side shopping cart with instant UI feedback
- **State:** `cart`, `isLoading`, `loadingProducts` (per-product), `updatingItemIds` (per-item Set)
- **Key Features:**
  - `updateQuantity()` — **Optimistic update + 300ms debounce + AbortController**. The UI shows the new quantity immediately. A debounced API call fires 300ms after the last change. If the user clicks +/- rapidly, previous in-flight requests are aborted. On failure, the cart reverts to its previous quantity.
  - `addToCart()` — Per-product loading map so individual "Add to Cart" buttons can show a spinner without disabling the whole page
  - `fetchCart()` — Module-level Promise deduplication prevents race conditions when multiple components request the cart simultaneously

#### `wishlistStore.js`
- **Purpose:** Toggle-based wishlist with per-product request locks and drawer UI state
- **State:** `wishlist`, `isLoading`, `hasFetched`, `isWishlistOpen`, `pendingProducts`
- **Key Feature:** `pendingProducts` object acts as a per-product mutex — if a product is already being toggled, duplicate clicks are silently ignored. Optimistic UI updates immediately; server response confirms; on failure, state rolls back.

#### `productStore.js`
- **Purpose:** Shared product store for both admin and customer views
- **State:** `products`, `product`, `homeProducts`, `filters`, `pagination`, `inventoryCounts`, `updatingProductIds`
- **Key Features:**
  - **AbortController** cancels previous list requests when filters change mid-flight
  - **Optimistic Updates** on `updateProduct` and `deleteProduct` with full rollback
  - **Inventory Counts** maintained in-memory and updated optimistically during CRUD to avoid a full refetch
  - Image management actions (upload, delete, set primary, reorder) all update local state without refetching

#### `adminStore.js`
- **Purpose:** Admin dashboard analytics and order management
- **State:** `analytics`, `cachedAt`, `detailedAnalytics`, `orders`, `updatingOrderIds`, `ordersPagination`
- **Key Features:**
  - **5-minute TTL cache** for analytics — subsequent calls within 5 minutes skip the API
  - **AbortController** for in-flight request cancellation on refresh
  - **Per-row optimistic updates** for order status changes with analytics KPI adjustment and full rollback
  - `URLSearchParams` builder for complex server-side query construction

#### `customerStore.js`
- **Purpose:** Admin customer list management
- **State:** `customers`, `selectedCustomer`, `updatingCustomerIds`, `pagination`
- **Key Feature:** Per-customer optimistic status updates with rollback — flipping a customer's active status updates the row instantly without loading the full page

#### `settingsStore.js`
- **Purpose:** Platform-level settings management for admin
- **State:** `domains` object (store, shipping, payment, smtp, security, notifications)
- **Key Feature:** Settings are organized by `domain`. Each domain has its own `isLoading/isSaving` flag, preventing cross-domain loading state bleed

#### `brandingStore.js`
- **Purpose:** Platform branding (logo, name, colors) used site-wide
- **State:** `branding`, `isLoading`
- **Flow:** Fetched once at app startup via `useBrandingStore`; used in Navbar, footer, auth pages, email templates

---

## Phase 5 — Backend Architecture

### Express Architecture

The backend is a **layered, class-based Node.js application** using Express.js with ES Modules (`"type": "module"`). The app is separated into `app.js` (configuration) and `server.js` (HTTP listener), which is a best practice for testability.

### Middleware Flow (in order of execution)

```
Incoming HTTP Request
        ↓
1. helmet()            — Sets 11+ security HTTP headers
2. Request ID Middleware — Assigns UUID to each request (X-Request-ID)
3. cors()              — Validates Origin against whitelist
4. express.json()      — Parses JSON request body
5. express.urlencoded() — Parses form data
6. cookieParser()      — Parses cookies (accessToken, refreshToken)
7. Rate Limiter        — Per-route limits (authLimiter, readLimiter, etc.)
8. Router              — Matches URL to handler
9. protect()           — Verifies JWT, checks tokenVersion
10. authorize(role)    — Validates user role (RBAC)
11. uploadX.single()   — Multer file parsing (only on upload routes)
12. validate(schema)   — Zod schema validation (only on mutation routes)
13. Controller         — Orchestrates service call and HTTP response
14. Service            — Business logic
15. Repository         — Prisma database query
        ↓
JSON Response
        ↓
errorHandler()         — Global error catcher (last middleware)
notFoundHandler()      — 404 handler
```

### Layer Responsibilities

**Controller Layer** — Thin. Reads `req.params`, `req.body`, `req.user`. Calls exactly one service method. Sends formatted response using `successResponse()` or `errorResponse()` utils. Never contains business logic.

**Service Layer** — The brain. Contains all business rules: checking if a user exists before registration, computing pricing for orders, validating stock levels, emitting email events. Completely independent of HTTP.

**Repository Layer** — Database access only. Contains all Prisma queries. No business rules. Services call repositories; repositories call Prisma. This separation means the database could theoretically be swapped with zero changes to services.

**Lib Layer (`lib/prisma.js`)** — Exports a single `PrismaClient` instance using the Node.js module singleton pattern. All repositories import the same client, preventing connection pool exhaustion.

---

## Phase 6 — Database Audit

### Database: PostgreSQL (Neon Serverless)

Managed via **Prisma ORM** with a declarative schema in `prisma/schema.prisma`. All migrations tracked in `prisma/migrations/`.

### Entity Relationship Diagram

```
User (1)
│
├──── (1) Cart ──── (M) CartItem ──── (1) Product
│
├──── (M) Order ──── (M) OrderItem ──── (1) Product
│
├──── (1) Wishlist ──── (M) WishlistItem ──── (1) Product
│
├──── (M) Address
│
├──── (M) Session (refresh token store)
│
├──── (M) SecurityLog
│
├──── (M) EmailLog
│
└──── (M) StockNotification ──── (1) Product

Product (1)
│
├──── (M) ProductImage
│
├──── (M) CartItem
│
├──── (M) OrderItem
│
├──── (M) WishlistItem
│
├──── (M) StockNotification
│
└──── (M) PromotionProduct ──── (1) Promotion

Promotion (1)
│
├──── (M) PromotionProduct ──── (1) Product
├──── (M) PromotionCategory
└──── (M) PromotionBrand

STANDALONE TABLES:
├── SystemSettings    (key-value JSON config store)
├── AuditLog          (admin action audit trail)
├── BrandingSettings  (platform identity)
├── SaleBanner        (homepage sale banners)
└── ShopBanner        (shop page banners)
```

### Table-by-Table Analysis

#### `User`
- **Purpose:** Stores all registered users (customers + admins)
- **Key Fields:** `role (CUSTOMER/ADMIN/SUPER_ADMIN)`, `failedLoginAttempts`, `lockoutUntil`, `tokenVersion` (invalidates all existing JWTs on password change), `isEmailVerified`, `verificationToken`, `resetPasswordToken`
- **Security:** `tokenVersion` incremented on password change forces token re-issue, invalidating all old sessions

#### `Product`
- **Indexes:** `stock`, `createdAt`, `category` — optimizes most common filter queries
- **Analytics Fields:** `totalSold`, `totalRevenue`, `totalViews`, `wishlistCount`, `cartCount`, `lastPurchasedAt` — stored denormalized for fast dashboard queries
- **Flags:** `featured`, `trending`, `bestSeller`, `newArrival`, `recommended` — boolean flags driving homepage section membership

#### `ProductImage`
- **Composite Unique:** `[productId, url]` — prevents duplicate images
- **Cascade Delete:** Deleting a product cascades to all its images in Cloudinary (via service) and database

#### `Order`
- **Payment Fields:** `transactionRef`, `cardBrand`, `last4Digits`, `maskedUPI` — stored for receipts without storing sensitive card data
- **Address as JSON:** `shippingAddress` and `billingAddress` stored as JSON snapshots — even if the user changes their address later, the order retains the exact address used at purchase time (correct historical record)
- **Indexes:** `userId`, `orderStatus`, `createdAt`, `paymentStatus` — all common filter dimensions for admin order management

#### `Session`
- **Purpose:** Database-backed refresh token store
- **Security:** Only the **SHA-256 hash** of the refresh token is stored (`refreshTokenHash`). The plaintext token is only sent once to the client and never persisted server-side.
- **Fields:** `device`, `browser`, `operatingSystem`, `ipAddress` for session visibility in the security dashboard

#### `SystemSettings`
- **Purpose:** Dynamic key-value JSON store for admin-configurable settings
- **Keys:** `store`, `shipping`, `payment`, `smtp`, `security`, `notifications`
- **Why not hardcoded:** Allows runtime changes to JWT expiry, shipping charges, lockout rules without redeploying

#### `AuditLog`
- **Purpose:** Tracks every admin settings change with old/new value snapshots, admin name, and IP address
- **Why it matters:** Compliance, debugging, accountability

#### `Promotion`
- **Types:** `PERCENTAGE_DISCOUNT`, `FLAT_DISCOUNT`, `BUY_X_GET_Y`, `FREE_SHIPPING`, `COUPON`, `FLASH_SALE`, `CATEGORY_DISCOUNT`, `BRAND_DISCOUNT`, `PRODUCT_DISCOUNT`
- **Applies To:** Can be scoped to the entire store, specific categories, brands, or individual products via join tables

### Enums

| Enum | Values |
|------|--------|
| `Role` | `CUSTOMER`, `ADMIN`, `SUPER_ADMIN` |
| `OrderStatus` | `PENDING`, `CONFIRMED`, `PROCESSING`, `PACKED`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `RETURNED`, `REFUNDED` |
| `PaymentStatus` | `PENDING`, `PAID`, `FAILED` |
| `CampaignType` | 9 types (PERCENTAGE_DISCOUNT, FLAT_DISCOUNT, etc.) |
| `CampaignStatus` | `DRAFT`, `SCHEDULED`, `ENABLED`, `DISABLED`, `EXPIRED`, `ARCHIVED` |
| `EmailStatus` | `PENDING`, `PROCESSING`, `SENT`, `FAILED` |
| `EmailProvider` | `SMTP`, `SES`, `SENDGRID`, `MAILGUN`, `POSTMARK`, `RESEND` |

---

## Phase 7 — Authentication Architecture

### Token Strategy

The system uses a **Dual Token (Access + Refresh) architecture** with database-backed session storage.

| Property | Access Token | Refresh Token |
|----------|-------------|---------------|
| Type | JWT (signed HS256) | Opaque random bytes (64 bytes hex) |
| Storage (client) | `localStorage` + Cookie | HTTP-only Cookie |
| Storage (server) | Not stored (stateless) | SHA-256 hash in `Session` table |
| Expiry | Configurable via `SystemSettings` (default: short) | Configurable via `SystemSettings` |
| Used for | Authenticating every API request | Obtaining a new Access Token |

### Password Security

- **Hashing:** `bcrypt` with 10 salt rounds (`hashPassword()` in `utils/bcrypt.js`)
- **Comparison:** Constant-time comparison via `bcrypt.compare()` — prevents timing attacks
- **Storage:** Only the hash is ever stored. The plaintext password is never persisted.

### Token Version Mechanism

The `User` model has a `tokenVersion` field. When a user changes their password, `tokenVersion` is incremented via `{ increment: 1 }`. Every JWT contains the `tokenVersion` at issuance time. The `protect` middleware validates:

```javascript
if (decoded.tokenVersion !== user.tokenVersion) {
  return errorResponse(res, 'Session expired or invalidated.', [], 401);
}
```

This **invalidates all previously issued JWTs** without maintaining a blocklist — a stateless revocation mechanism.

### Registration Flow
```
POST /api/auth/register
  → Validate input (name, email, password)
  → Check for duplicate email
  → Hash password with bcrypt (10 rounds)
  → Generate random 32-byte verification token
  → Create User record in DB
  → Emit 'user.registered' and 'user.verification_requested' events (async)
  → Email system sends verification email (non-blocking)
  → Generate access JWT
  → Return { user, token }
```

### Login Flow
```
POST /api/auth/login
  → Find user by email
  → Check account lockout (if enabled in SecuritySettings)
  → bcrypt.compare(password, hash)
  → On failure: increment failedLoginAttempts, lock if threshold exceeded, log SecurityLog
  → On success: reset failed attempts
  → Parse User-Agent (browser, OS, device via ua-parser-js)
  → Generate JWT access token
  → Generate 64-byte random refresh token (hex)
  → Hash refresh token (SHA-256)
  → Create Session record with hash, device info, IP, expiry
  → Set cookies (accessToken, refreshToken)
  → Log SecurityLog: LOGIN_SUCCESS
  → Return { user, accessToken, refreshToken }
```

### Token Refresh Flow
```
POST /api/auth/refresh
  → Read refreshToken from cookie
  → SHA-256 hash the received token
  → Query Session table for matching hash (isActive=true)
  → Check session expiry
  → ROTATE: Generate new refresh token, hash it, update Session record
  → Issue new access token
  → Set new cookies
  → Log SecurityLog: TOKEN_REFRESHED
```

### Frontend Auto-Refresh (`api.js`)
The Axios response interceptor intercepts `401` errors on non-auth routes:
1. If `isRefreshing = false`: fires `/auth/refresh`, queues subsequent failed requests
2. After refresh succeeds: retries all queued requests with new token
3. If refresh fails: clears localStorage, redirects to `/login`
This pattern is called the **Failed Request Queue pattern** — prevents multiple simultaneous refresh calls.

### Logout Flow
```
POST /api/auth/logout
  → Hash the refresh token from cookie
  → Find and delete the Session record
  → Log SecurityLog: LOGOUT
  → Client clears localStorage, sessionStorage
  → Zustand clears: auth, user, cart, wishlist stores
```

### RBAC (Role-Based Access Control)

Two middleware layers are chained:
1. `protect` — validates JWT and fetches user; populates `req.user`
2. `authorize('ADMIN')` — checks `req.user.role` against allowed roles

```javascript
// SUPER_ADMIN is automatically included when 'ADMIN' is authorized
if (allowedRoles.includes('ADMIN')) {
  allowedRoles.push('SUPER_ADMIN');
}
```

All admin routes apply `router.use(protect)` and `router.use(authorize('ADMIN'))` at the router level, protecting every admin endpoint by default.

---

## Phase 8 — API Audit

### Endpoint Table

| Method | Endpoint | Auth | Used By | Purpose |
|--------|----------|------|---------|---------|
| GET | `/api/branding` | None | All Pages | Fetch platform branding (logo, name) |
| GET | `/api/home` | None | HomePage | Aggregated homepage sections |
| **AUTH** | | | | |
| POST | `/api/auth/register` | None | RegisterPage | Create account + JWT |
| POST | `/api/auth/login` | None | LoginPage | Authenticate + issue tokens |
| POST | `/api/auth/logout` | Cookie | All | Invalidate session |
| POST | `/api/auth/refresh` | Cookie | api.js interceptor | Rotate tokens silently |
| GET | `/api/auth/me` | JWT | AppInit | Hydrate auth state |
| POST | `/api/auth/change-password` | JWT | ProfilePage | Change password |
| POST | `/api/auth/forgot-password` | None | LoginPage | Send reset email |
| POST | `/api/auth/reset-password` | None | ResetPage | Reset password with token |
| POST | `/api/auth/verify-email` | None | VerifyPage | Email verification |
| **PRODUCTS** | | | | |
| GET | `/api/products` | None | ProductList, Admin | List with filter/sort/page |
| GET | `/api/products/:id` | None | ProductDetail | Single product |
| GET | `/api/products/featured` | None | HomePage | Featured products |
| GET | `/api/products/trending` | None | HomePage | Trending products |
| GET | `/api/products/new` | None | HomePage | New arrivals |
| GET | `/api/products/best-sellers` | None | HomePage | Best sellers |
| GET | `/api/products/recommended` | None | ProductDetail | Recommended products |
| GET | `/api/products/categories` | None | Filters | All categories |
| GET | `/api/products/search/suggestions` | None | SearchBar | Autocomplete |
| GET | `/api/products/:id/related` | None | ProductDetail | Related products |
| POST | `/api/products` | ADMIN | AdminProducts | Create product |
| PUT | `/api/products/:id` | ADMIN | AdminProducts | Update product |
| DELETE | `/api/products/:id` | ADMIN | AdminProducts | Delete product |
| POST | `/api/products/:id/images` | ADMIN | AdminProducts | Upload images |
| DELETE | `/api/products/:id/images/:imageId` | ADMIN | AdminProducts | Delete image |
| PUT | `/api/products/:id/images/reorder` | ADMIN | AdminProducts | Reorder images |
| PUT | `/api/products/:id/images/:imageId/primary` | ADMIN | AdminProducts | Set primary image |
| **CART** | | | | |
| GET | `/api/cart` | JWT | CartPage | Fetch cart |
| POST | `/api/cart/items` | JWT | ProductDetail | Add item |
| PUT | `/api/cart/items/:productId` | JWT | CartPage | Update quantity |
| DELETE | `/api/cart/items/:productId` | JWT | CartPage | Remove item |
| DELETE | `/api/cart` | JWT | Checkout | Clear cart |
| **WISHLIST** | | | | |
| GET | `/api/wishlist` | JWT | WishlistDrawer | Fetch wishlist |
| POST | `/api/wishlist/toggle` | JWT | ProductCard | Toggle wishlist |
| **ORDERS** | | | | |
| POST | `/api/orders` | JWT | CheckoutPage | Place order (ACID transaction) |
| GET | `/api/orders` | JWT | OrdersPage | Customer order history |
| GET | `/api/orders/:id` | JWT | OrderDetailPage | Single order |
| **ADMIN** | | | | |
| GET | `/api/admin/dashboard` | ADMIN | Dashboard | KPI analytics |
| GET | `/api/admin/dashboard/revenue` | ADMIN | AnalyticsDrawer | Revenue analytics |
| GET | `/api/admin/dashboard/orders` | ADMIN | AnalyticsDrawer | Order analytics |
| GET | `/api/admin/dashboard/customers` | ADMIN | AnalyticsDrawer | Customer analytics |
| GET | `/api/admin/dashboard/products` | ADMIN | AnalyticsDrawer | Product analytics |
| GET | `/api/admin/dashboard/inventory-alerts` | ADMIN | Dashboard | Low stock alerts |
| GET | `/api/admin/orders` | ADMIN | AdminOrders | All orders, paginated |
| PUT | `/api/admin/orders/:id/status` | ADMIN | AdminOrders | Update order status |
| GET | `/api/admin/customers` | ADMIN | AdminCustomers | All customers, paginated |
| PUT | `/api/admin/customers/:id/status` | ADMIN | AdminCustomers | Enable/disable customer |
| PUT | `/api/admin/branding` | ADMIN | AdminSettings | Update branding |
| POST | `/api/admin/branding/logo` | ADMIN | AdminSettings | Upload logo |
| **SETTINGS** | | | | |
| GET | `/api/settings/public-config` | None | CustomerPages | Public store config |
| GET | `/api/settings/:domain` | ADMIN | AdminSettings | Domain settings |
| PUT | `/api/settings/:domain` | ADMIN | AdminSettings | Update domain settings |
| GET | `/api/settings/audit-logs` | ADMIN | AuditLogsTab | Admin audit trail |

---

## Phase 9 — Admin Architecture

### Dashboard (`/admin/dashboard`)
- **Data Source:** `GET /api/admin/dashboard` — aggregated KPIs computed server-side via Prisma aggregate queries
- **KPIs:** Total revenue, total orders, total customers, delivered orders, cancelled orders
- **Charts:** Revenue trend (line chart), order status distribution (pie chart)
- **Cache:** `adminStore` caches for 5 minutes; `AbortController` cancels stale requests
- **Analytics Drawers:** Each KPI card opens a side drawer that fetches granular data (`/admin/dashboard/revenue`, etc.)

### Products Admin (`/admin/products`)
- Server-side filtered, sorted, paginated product list
- Inventory tabs: All / Active / Out of Stock
- **AbortController:** Previous requests cancelled when filters change
- **Optimistic CRUD:** Create/Update/Delete all update local state immediately with rollback
- **Image Management:** Multi-image upload with Cloudinary, drag-to-reorder, primary image selection

### Orders Admin (`/admin/orders`)
- Server-side filtered, sorted, paginated order list
- Filter by: Order Status, Payment Status, Date Range, Sort
- Status updates: **Optimistic UI** — row updates immediately; status distribution in analytics also updates optimistically
- `StatusDropdown` component with portal positioning (renders via `createPortal` to avoid overflow/z-index issues)

### Customers Admin (`/admin/customers`)
- Paginated customer list with search
- Side drawer with customer detail (orders, profile, addresses)
- **Enable/Disable Account** — optimistic update per row

### Settings (`/admin/settings`)
- Tab-based: Store Info, Shipping, Payment, SMTP, Security, Notifications, Branding, Audit Logs
- Each tab loads its domain independently; saving is domain-scoped
- **Audit Logs tab:** Paginated log of all admin settings changes
- **SMTP Test:** Live connection test before saving credentials

### Homepage Settings (`/admin/homepage`)
- Manage Sale Banners, Shop Banners
- Image upload directly to Cloudinary

---

## Phase 10 — Customer Architecture

### Authentication Flow
1. Register at `/register` → JWT issued → `authStore` persisted to `localStorage`
2. Login at `/login` → same flow
3. On app load: `checkAuth()` calls `/auth/me` to validate stored token
4. Silent refresh handled by Axios interceptor on 401 responses

### Product Discovery
- `/products` — server-side filtered list: category, brand, price range, rating, in-stock, sale, sort
- `/products/:id` — product detail with image gallery, related products, wishlist toggle, stock notifications
- `useAdminFilters` hook not used here — product store manages filter state directly

### Wishlist
- Heart icon on product cards triggers `wishlistStore.toggleWishlist(productId)`
- **Optimistic:** Heart fills immediately; confirmed by server response
- Wishlist drawer slides in from right (managed by `isWishlistOpen` in `wishlistStore`)

### Cart
- **Persistent** — cart is stored server-side, synced on every operation
- `updateQuantity` is **debounced (300ms) + AbortController** — rapidly clicking +/- sends only the final API call
- Optimistic removal with automatic rollback on failure
- `FloatingCartBar` component shows item count with animation

### Checkout (`/checkout`)
- Multi-step: Address Selection → Payment Method → Order Summary → Confirm
- **ACID Transaction** on backend: stock reduction + order creation + cart clear in a single database transaction
- Order success page at `/order-success/:id`

### Addresses (`/addresses`)
- CRUD for saved addresses
- Support for default shipping and default billing flags

### Profile (`/profile`)
- Update personal info (name, phone, birthday, gender)
- Upload avatar photo (Cloudinary via Multer)
- Change password (requires current password)

### Orders (`/orders`, `/orders/:id`)
- Order history list with status badges
- Detail view with timeline, items, address, payment info

---

## Phase 11 — UI Architecture

### Design System (`/frontend/src/theme`)

The design system is defined as JavaScript objects imported into `tailwind.config.js`:

| File | Contents |
|------|----------|
| `colors.js` | Full color palette (brand, danger, success, warning, surface, text) |
| `typography.js` | Font family (Source Sans Pro), font sizes, line heights, letter spacing |
| `shadows.js` | Box shadow presets |
| `radius.js` | Border radius presets |
| `spacing.js` | Custom spacing scale |
| `gradients.js` | Background gradient presets |

All components use Tailwind utility classes that reference these tokens. This means design changes propagate globally by editing token files.

### Reusable Component Library (`/frontend/src/components/ui`)

| Component | Purpose |
|-----------|---------|
| `Input.jsx` | Text input with label, error, icon slots, password toggle |
| `Button.jsx` | Primary/secondary/ghost buttons with loading state |
| `StatusDropdown.jsx` | Order status selector with portal positioning |
| `LoadingSpinner.jsx` | Centered, sized spinner |
| `SkeletonLoader.jsx` | Placeholder loading skeleton |
| `ImageFallback.jsx` | Image with automatic fallback on error |
| `PhoneInput.jsx` | International phone input with E.164 format |
| `ConfirmDialog.jsx` | Reusable confirmation modal |
| `Pagination.jsx` | Page number navigation component |
| `EmptyState.jsx` | Illustrated empty data placeholder |

### Responsive Design
All layouts are mobile-first responsive using Tailwind breakpoints (`sm:`, `md:`, `lg:`). Admin panels collapse to mobile-friendly layouts. Drawers use full-width on mobile, fixed width on desktop.

### Loading States
- **Skeleton Loaders:** Used on initial data loads (product lists, dashboard KPIs)
- **Spinner:** Used on forms, buttons, and inline data fetches
- **Per-row loading:** Admin tables show per-row spinners using `updatingProductIds` / `updatingOrderIds` Sets

### Animations
- **Framer Motion:** Page transitions, drawer slide animations, dashboard card animations
- **Tailwind Animations:** Fade-in, slide-in (via `animate-in` + `tailwindcss-animate` utilities)

---

## Phase 12 — Performance

### Server-Side Filtering
All admin list views and the product catalog use **100% server-side filtering**. No data is fetched and filtered on the frontend. This means:
- Query returns only the records matching the filters
- Pagination is accurate
- No memory issues from loading thousands of products

### AbortController
Used in: `productStore.fetchProducts`, `productStore.fetchAdminProducts`, `adminStore.fetchAnalytics`, `adminStore.fetchOrders`, `customerStore.fetchCustomers`

When filters change while a request is in flight, the previous request is aborted. This prevents **race conditions** where a slower earlier request overwrites the result of a faster later request.

### Debouncing
- **Cart quantity updates:** 300ms debounce prevents API spam when user clicks +/- rapidly
- **Admin search inputs:** `useAdminFilters` debounces the URL search param update by 300ms

### Request Deduplication
- `cartStore.fetchCart()` — module-level Promise prevents parallel cart fetches
- `wishlistStore.fetchWishlist()` — same pattern
- `authStore.checkAuth()` — module-level Promise deduplication
- `settingsStore.fetchPublicConfig()` — same pattern

### Optimistic UI
Used in: Cart (quantity update, remove), Wishlist (toggle), Products (update, delete), Orders (status change), Customers (status toggle)

Pattern:
1. Save previous state
2. Apply change immediately to local state
3. Fire API request
4. On success: confirm or sync with server response
5. On failure: roll back to previous state + show error toast

### Code Splitting
Every page is `React.lazy()` imported. Only the visited page's code is loaded. Reduces initial bundle to ~50-80KB.

### Image Optimization via Cloudinary
- Images are served from Cloudinary's global CDN
- Cloudinary automatically serves WebP format where supported
- `multer-storage-cloudinary` streams files directly from the request to Cloudinary without saving to disk

### Pagination
- Frontend sends `?page=X&limit=Y`
- Backend computes `skip = (page-1) * limit`, uses `prisma.findMany({ skip, take })`
- Response includes `{ currentPage, totalPages, totalItems, itemsPerPage }`
- Component renders pagination controls

---

## Phase 13 — Security

### Authentication Security
- **bcrypt** (10 rounds) for password hashing — computationally expensive, resists brute-force
- **Token versioning** invalidates all existing JWTs after password change
- **SHA-256 hashed** refresh tokens stored in DB — plaintext never persisted
- **Refresh token rotation** — every refresh issues a new token; old token immediately invalidated

### Account Lockout
Configured via `SystemSettings.security`:
- `accountLockoutEnabled` — enable/disable the feature
- `failedLoginLimit` — number of failures before lockout (default: 5)
- `lockDuration` — how long the account is locked (default: `15m`)
- Failed attempts and lockout times stored per user in the `User` table

### HTTP Security Headers (Helmet)
Helmet sets: `X-DNS-Prefetch-Control`, `X-Frame-Options` (clickjacking), `X-Powered-By` (removed), `Strict-Transport-Security` (HSTS), `X-Content-Type-Options` (MIME sniffing), `Content-Security-Policy`, `Referrer-Policy`, `X-Permitted-Cross-Domain-Policies`

### CORS
```javascript
origin: (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin)) callback(null, true);
  else callback(new Error('Not allowed by CORS'));
}
```
Only whitelisted origins (`FRONTEND_URL` env var) can make cross-origin requests. `credentials: true` allows cookie sharing.

### Rate Limiting (Granular)

| Limiter | Routes | Limit |
|---------|--------|-------|
| `authLimiter` | `/api/auth/*` | 20 req / 15 min |
| `globalLimiter` | Cart, Wishlist, Orders, Users | 500 req / 15 min |
| `readLimiter` | Products, Home, Settings, Promotions | 1000 req / 15 min |
| `adminLimiter` | `/api/admin/*` | 2000 req / 15 min |

Rate limiter uses `standardHeaders: 'draft-7'` to communicate limits via `RateLimit-*` headers to clients.

### Input Validation
- **Backend:** All mutation endpoints pass through Zod schema validation middleware (`validationMiddleware.js`). Invalid payloads receive `400` before touching the database.
- **Frontend:** Client-side validation in `utils/validators.js` using regex and length checks.

### SQL Injection Prevention
Prisma ORM uses **parameterized queries exclusively**. User input is never interpolated into SQL strings. There is no raw SQL in the codebase.

### XSS Prevention
- Helmet's CSP header restricts where scripts can load from
- React's JSX automatically escapes values inserted into the DOM
- No use of `dangerouslySetInnerHTML`

### Environment Variables
All secrets (DATABASE_URL, JWT_SECRET, CLOUDINARY_*, SMTP credentials) are in `.env` files, excluded from git via `.gitignore`. `dotenv` loads them at startup.

### Password Field Security
- Copy, paste, and cut operations are blocked on all `type="password"` fields (via `onCopy`, `onPaste`, `onCut` prevention in the `Input` component)

### Security Logging
Every significant auth event is written to `SecurityLog`: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `TOKEN_REFRESHED` — with IP address, browser, device context.

---

## Phase 14 — Library Audit

### Frontend Libraries

| Library | Why Chosen | Where Used |
|---------|-----------|-----------|
| **React 18** | Industry standard, component model, hooks | Entire frontend |
| **Vite** | Fastest dev server, ES Module native HMR | Build tool, dev server |
| **React Router v6** | Declarative routing, nested routes, loaders | `AppRoutes.jsx`, all navigation |
| **Zustand** | Minimal API (no Provider), easy debugging, middleware | All 16 stores |
| **Axios** | Interceptors for token refresh, structured errors, cancellation | `api.js`, all HTTP calls |
| **Tailwind CSS** | Utility-first, design tokens, no runtime CSS | All styling |
| **Framer Motion** | Hardware-accelerated, declarative animations | Drawers, transitions, dashboard |
| **Lucide React** | Tree-shakeable, consistent icon set | All icons |
| **React Hot Toast** | Accessible, non-blocking notifications | Cart, error, success toasts |
| **react-phone-number-input** | E.164 format, international flags | RegisterPage phone input |
| **Recharts** | SVG-based, React-first chart library | Dashboard analytics charts |
| **clsx / twMerge** | Conditional Tailwind class merging | Component utility |

### Backend Libraries

| Library | Why Chosen | Where Used |
|---------|-----------|-----------|
| **Express.js** | Minimal, battle-tested, huge ecosystem | HTTP server framework |
| **Prisma** | Type-safe ORM, schema-first, auto-migration | All database queries |
| **bcrypt** | Industry standard, adaptive cost | Password hashing |
| **jsonwebtoken** | Standard JWT library | Token sign/verify |
| **helmet** | One import, 11+ security headers | Global middleware |
| **cors** | Configurable origin whitelist | Cross-origin handling |
| **express-rate-limit** | Per-route rate limiting | Rate limiter middleware |
| **cookie-parser** | Parse HTTP-only cookies | Refresh token cookie |
| **multer** | Multipart form-data parser | File upload middleware |
| **multer-storage-cloudinary** | Streams files directly to Cloudinary | Image upload routes |
| **cloudinary** | CDN image storage and transformations | Product/Avatar/Banner images |
| **nodemailer** | SMTP-agnostic email sending | Transactional emails |
| **handlebars** | Logic-less HTML templates | Email templates |
| **zod** | Schema-first runtime validation | Request body validation |
| **ms** | Human-readable time duration parsing | JWT expiry, lockout duration |
| **ua-parser-js** | User-Agent string parsing | Session device/browser detection |
| **crypto** (Node built-in) | SHA-256 refresh token hashing, UUID generation | Session security |
| **dotenv** | `.env` file loading | All environment config |
| **nodemon** | Auto-restart on file change | Development |

---

## Phase 15 — JavaScript Concepts Audit

### Async/Await & Promises

**Where:** Every store action, service method, repository query, controller handler  
**Why:** Non-blocking I/O — database queries and HTTP calls are I/O operations that should not block the event loop  
**Example from project:**
```javascript
// cartStore.js — async/await with AbortController
updateTimeouts[productId] = setTimeout(async () => {
  const controller = new AbortController();
  abortControllers[productId] = controller;
  const response = await api.put(`/cart/items/${productId}`, { quantity }, {
    signal: controller.signal
  });
  set({ cart: response.data.data });
}, 300);
```

### Closures

**Where:** `cartStore.js` — `abortControllers`, `updateTimeouts`, `previousQuantities` are module-level objects that the store's actions close over  
**Why:** Persist state between function calls without polluting global scope  
**Example:**
```javascript
// Module-level closure variables
const abortControllers = {};
const updateTimeouts = {};
const previousQuantities = {};
```

### AbortController

**Where:** `productStore.fetchProducts`, `adminStore.fetchAnalytics`, `cartStore.updateQuantity`, `customerStore.fetchCustomers`  
**Why:** Prevents stale responses from overwriting newer results; reduces unnecessary network usage  
**Example:**
```javascript
if (productsAbortController) productsAbortController.abort();
productsAbortController = new AbortController();
const { data } = await productService.getProducts({...}, { signal: productsAbortController.signal });
```

### Optional Chaining (`?.`)

**Where:** Extensively throughout stores and components  
**Example:** `error.response?.data?.message || 'Default error'` — safely traverses the error object hierarchy

### Nullish Coalescing (`??`)

**Where:** Service and repository files  
**Example:** `shipping?.freeShippingThreshold ?? Infinity` — defaults to `Infinity` only when value is `null` or `undefined`

### Destructuring

**Where:** Component props, store selectors, API responses  
**Example:** `const { cart, isLoading, addToCart } = useCartStore();`

### Spread Operator

**Where:** Zustand state updates  
**Example:** `set((state) => ({ cart: { ...state.cart, items: [...state.cart.items, newItem] } }))`

### Array Methods

| Method | Where Used |
|--------|-----------|
| `.map()` | Every list render (`products.map(p => <ProductCard />)`) |
| `.filter()` | Optimistic item removal (`items.filter(i => i.id !== id)`) |
| `.find()` | Item lookups (`items.find(i => i.productId === productId)`) |
| `.some()` | Wishlist check (`items.some(i => i.productId === id)`) |
| `.reduce()` | Cart total computation |
| `.forEach()` | Processing arrays of IDs, params |
| `.includes()` | Status/role validation checks |
| `.flat()` | Flattening nested arrays |

### Set (ES6)

**Where:** `updatingProductIds`, `updatingOrderIds`, `updatingItemIds`, `updatingCustomerIds` in stores  
**Why:** O(1) `has()`, `add()`, `delete()` operations; guaranteed uniqueness for per-row loading state  
**Example:**
```javascript
updatingProductIds: new Set([...state.updatingProductIds, id]),
```

### URLSearchParams

**Where:** `adminStore.fetchOrders` and `customerStore.fetchCustomers` — builds complex query strings  
**Example:**
```javascript
const queryParams = new URLSearchParams();
queryParams.append('page', page);
queryParams.append('status', filters.status);
await api.get(`/admin/orders?${queryParams.toString()}`);
```

### Dynamic Imports

**Where:** `AppRoutes.jsx` for code splitting; `authStore.js` for avoiding circular dependencies  
**Example:**
```javascript
// Avoid circular imports during logout
import('./cartStore').then(module => module.default.getState().resetCart());
```

### Template Literals

**Where:** API URL construction, error messages, email templates  
**Example:** `` const url = `${getFrontendUrl()}/verify-email?token=${verificationToken}`; ``

### JSON.parse / JSON.stringify

**Where:** `api.js` reads Zustand persisted auth from localStorage  
**Example:**
```javascript
const parsed = JSON.parse(localStorage.getItem('auth-storage'));
token = parsed?.state?.token;
```

### EventEmitter (Node.js)

**Where:** `email/utils/emailEvents.js` — custom EventEmitter used to decouple email sending from business logic  
**Why:** Services emit events; email listeners handle them asynchronously without blocking the HTTP response  
**Example:**
```javascript
emailEvents.emit('order.created', order); // In orderService
emailEvents.on('order.created', sendConfirmationEmail); // In emailService
```

### crypto (Node built-in)

**Where:** `authService.js`  
**Why:** Cryptographically secure random token generation and SHA-256 hashing  
**Example:**
```javascript
const refreshTokenPlain = crypto.randomBytes(64).toString('hex');
const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenPlain).digest('hex');
```

### Classes

**Where:** All backend services and repositories use ES6 class syntax  
**Why:** Encapsulates related methods; `export default new AuthService()` creates a singleton  
**Example:** `class AuthService { async register(data) {...} }`

### try/catch/finally

**Where:** Every async function in stores, services, and controllers  
**Why:** Structured error handling that ensures cleanup code runs regardless of success/failure  
**Example:** `finally { set({ isLoading: false }); }` — always clears loading state

### localStorage / sessionStorage

**Where:** `authStore` persistence, `api.js` token reading  
**Example:** `localStorage.getItem('auth-storage')`, `localStorage.removeItem('token')`

### FormData

**Where:** Image upload functions in store  
**Example:** File data is sent as multipart form data via Axios; Multer parses it on the backend

### Higher-Order Functions

**Where:** Middleware factory functions  
**Example:**
```javascript
export const authorize = (...roles) => {  // HOF
  return (req, res, next) => {           // Returns middleware function
    if (!allowedRoles.includes(req.user.role)) return errorResponse(res, 403);
    next();
  };
};
```

### ES Modules

**Where:** Entire codebase uses `import/export` syntax  
**Backend:** `"type": "module"` in `package.json`  
**Frontend:** Vite handles ESM natively

### Object.entries / Object.keys / Object.values

**Where:** `useAdminFilters.js` — iterating over URL search params; settings store — domain iteration  
**Example:** `Object.fromEntries(searchParams.entries())`

### Regex

**Where:** `validators.js` — password validation rules  
**Example:** `/[A-Z]/.test(password)`, `/[^A-Za-z0-9]/.test(password)`

---

## Phase 16 — Complete User Flows

### Customer Registration and Purchase Flow

```
1. Visit /register
   ↓
2. Fill form (name, email, phone, password)
   ↓ (client-side validation via validators.js)
3. POST /api/auth/register
   → bcrypt hash password
   → Create User record
   → Emit verification email (async)
   → Return JWT
   ↓
4. Zustand authStore persists { user, token } to localStorage
   ↓
5. Navigate to /products — browse catalog
   → Server-side filter/sort/paginate via AbortController-protected requests
   ↓
6. Click heart icon → wishlistStore.toggleWishlist (optimistic)
   ↓
7. Click "Add to Cart" → cartStore.addToCart
   → POST /api/cart/items
   → Toast notification
   ↓
8. Navigate to /cart — review items
   → Adjust quantity (debounced + AbortController)
   → Remove item (optimistic)
   ↓
9. Navigate to /checkout (CustomerProtectedRoute)
   → Select address
   → Select payment method
   → Confirm order
   ↓
10. POST /api/orders → ACID transaction:
    → Validate stock
    → Compute prices with promotions
    → BEGIN TRANSACTION:
      → Reduce product stock
      → Create Order + OrderItems
      → Delete CartItems
    → COMMIT
    → setImmediate: emit email events (non-blocking)
   ↓
11. Navigate to /order-success/:id
   ↓
12. Email received: Order Confirmation
```

### Admin Order Management Flow

```
1. Visit /admin/login
   ↓
2. POST /api/auth/login
   → Verify ADMIN role
   → Issue JWT + Refresh Token
   → Create Session record
   ↓
3. Navigate to /admin/dashboard
   → GET /api/admin/dashboard (5-min cached)
   → KPI cards + charts render
   ↓
4. Navigate to /admin/orders
   → GET /api/admin/orders (server-side filtered + paginated)
   → Filter by status/date/payment status
   ↓
5. Click status dropdown on a row
   → Optimistic update: row shows new status immediately
   → Dashboard status distribution updates optimistically
   → PUT /api/admin/orders/:id/status
   → On success: loading indicator clears
   → On failure: row reverts + error toast
   ↓
6. Open order detail drawer
   → GET /api/admin/orders/:id
   → Full order detail with customer info, items, addresses
```

---

## Phase 17 — Engineering Decisions

### Why React?
React's component model and hooks API enable clean separation of UI and logic. The ecosystem (React Router, Framer Motion, React Hot Toast) is mature and well-supported. React 18's concurrent features (Suspense for code splitting) are used for lazy loading.

### Why Vite?
Vite's dev server starts in <300ms regardless of project size by serving ES Modules directly to the browser. Compared to webpack/CRA which bundles everything first, Vite's HMR is near-instantaneous. Production builds use Rollup for highly optimized output.

### Why Express?
Express is the most widely used Node.js framework, with the largest ecosystem. Its explicit, minimal design lets you compose exactly the middleware stack you need. For a project of this scale, Express is more appropriate than Next.js (no SSR requirement) or NestJS (too heavyweight for one backend).

### Why Prisma?
Prisma's schema-first approach generates a fully type-safe client, eliminating an entire class of runtime errors. Auto-migration and the `prisma studio` GUI accelerate development. Compared to Sequelize, Prisma's API is more developer-friendly and its type inference is superior.

### Why PostgreSQL?
The data has clear relational structure (Users → Orders → OrderItems → Products). PostgreSQL's ACID compliance is critical for the checkout transaction (stock, order, cart must all change atomically). The JSON column type for `shippingAddress` snapshots gives document-style flexibility where needed.

### Why Zustand?
Redux requires Provider, reducers, actions, selectors, and middleware — 5x the boilerplate for the same result. Zustand's `create()` API is a plain function that returns a hook. No Provider needed. Stores import each other naturally. The `persist` middleware handles localStorage hydration without custom code.

### Why Repository Pattern?
Repositories isolate all database query code from business logic. If Prisma is replaced tomorrow, only the repository layer needs to change — services and controllers are untouched. It also makes unit testing trivial: mock the repository, test the service.

### Why Service Layer?
Without a service layer, business logic bleeds into controllers (coupling HTTP to business rules) or repositories (coupling data access to business rules). The service is the correct home for rules like "check stock before creating an order."

### Why JWT?
JWT allows stateless authentication — the server doesn't need to look up a session on every request, improving scalability. The dual-token strategy (short-lived access + long-lived refresh) balances security and user experience. Token versioning adds the ability to revoke all tokens without a blocklist.

### Why Cloudinary?
Storing images locally fails in serverless or containerized environments. Cloudinary provides a CDN-hosted image storage solution with automatic format optimization (WebP), resizing transformations, and global distribution — without maintaining any image infrastructure.

### Why Server-Side Pagination?
Fetching all records and paginating on the frontend would cause: massive API responses, high memory usage in the browser, and incorrect pagination when filters change. Server-side pagination with `skip/take` ensures queries are always O(page_size), not O(total_records).

### Why Optimistic UI?
The perceived performance gain is enormous. An admin changing an order status from `PENDING` to `CONFIRMED` sees the change in 0ms — not after a 200-300ms round trip. The rollback mechanism ensures correctness: if the server rejects the change, the UI reverts automatically.

---

## Phase 18 — Manager Q&A Preparation

### Q1: Why Zustand instead of Redux?
**Answer:** Redux requires setting up actions, reducers, selectors, a Provider, and often redux-thunk/saga for async. Zustand does the same in 10-15 lines with a `create()` call. For a solo or small team, the reduced boilerplate is a significant productivity gain. Zustand also has built-in `persist` middleware and supports `subscribeWithSelector` for fine-grained re-renders. **Trade-off:** Redux DevTools integration is marginally better; Redux is more suitable for very large teams needing strict action-naming conventions.

### Q2: Why Prisma instead of Sequelize?
**Answer:** Prisma's schema-first workflow generates a fully type-safe client. With Sequelize, you define models in JavaScript with loose types. Prisma catches column name typos at compile time; Sequelize would throw at runtime. Prisma's migration system is also cleaner. **Trade-off:** Prisma generates raw SQL but doesn't let you easily write complex multi-join queries compared to raw Knex; we use Prisma's `include` for those cases.

### Q3: Why PostgreSQL instead of MongoDB?
**Answer:** Our data is highly relational: Users have Orders, Orders have OrderItems linked to Products. MongoDB would force us to either embed data (causing update anomalies) or do application-level joins. PostgreSQL provides ACID transactions — critical for the checkout flow where stock reduction, order creation, and cart clearing must all succeed or all fail atomically. **Trade-off:** MongoDB's schema flexibility is nice for rapidly changing product attributes; PostgreSQL's `Json` column type covers that use case when needed.

### Q4: Explain the authentication flow.
**Answer:** Login issues a short-lived JWT (access token) and a long-lived opaque refresh token. The access token authenticates API requests. The refresh token is stored as a SHA-256 hash in a Session table and sent to the client as an HTTP cookie. When the access token expires, the Axios interceptor automatically calls `/auth/refresh`, which rotates the refresh token (old hash deleted, new hash stored) and issues a new access token. Token versioning on the User model means changing your password invalidates all existing access tokens globally.

### Q5: How do you prevent race conditions in the cart?
**Answer:** Three mechanisms: (1) **Debouncing** — quantity updates are batched with a 300ms timeout; rapid clicks don't spawn multiple requests. (2) **AbortController** — if a quantity update request is in-flight when another change comes in, the first request is aborted. (3) **Request deduplication** — `fetchCart()` uses a module-level Promise; if called twice before the first resolves, only one HTTP request is made.

### Q6: How is pagination implemented?
**Answer:** Server-side. The frontend sends `?page=X&limit=Y`. The backend computes `skip = (page-1) * limit` and passes it to Prisma's `findMany({ skip, take })`. Simultaneously, a `count()` query runs in a `Promise.all` to get the total. The response includes `{ currentPage, totalPages, totalItems, itemsPerPage }`. The frontend pagination component uses this to render page controls.

### Q7: How do you optimize API performance?
**Answer:** (1) **AbortController** cancels stale requests when filter state changes. (2) **Caching** in `adminStore` — dashboard analytics are cached for 5 minutes client-side. (3) **Server-side filtering** — only matching records are fetched, never the full table. (4) **Database indexes** on `createdAt`, `orderStatus`, `category`, `stock` — the most frequently filtered columns. (5) **`Promise.all`** for parallel database queries in the same request (e.g., `findMany` + `count` run simultaneously). (6) **setImmediate** for background tasks (email, cache invalidation) — these don't block the HTTP response.

### Q8: Why did you use a Repository pattern?
**Answer:** Separation of concerns. Repositories hold all Prisma/SQL logic. Services hold business logic. If we switch from Prisma to a raw `pg` client or a different ORM, only the repository layer changes. It also makes testing easier: mock the repository interface, test the service in isolation.

### Q9: How is RBAC implemented?
**Answer:** Two middleware layers: `protect` (JWT verification) and `authorize(role)`. `protect` verifies the token and attaches `req.user`. `authorize('ADMIN')` checks `req.user.role` against an allowlist. `SUPER_ADMIN` is automatically included in the `ADMIN` allowlist. Admin routes apply both middlewares at the router level: `router.use(protect)` and `router.use(authorize('ADMIN'))`.

### Q10: How does Optimistic UI work?
**Answer:** For cart remove: (1) Save previous cart state. (2) Immediately remove the item from local Zustand state (UI updates instantly). (3) Fire `DELETE /api/cart/items/:id`. (4) On success: sync with server response. (5) On failure: restore previous state + show error toast. The user sees instant feedback; correctness is guaranteed by the rollback mechanism.

### Q11: How do you handle image uploads?
**Answer:** Multer (`multer-storage-cloudinary`) parses the multipart request and streams the file directly to Cloudinary. No file touches the disk. Cloudinary returns a URL and `publicId`. The URL is stored in the `ProductImage` table. Deletion involves calling Cloudinary's destroy API with the `publicId` before removing the database record.

### Q12: How do you secure the APIs?
**Answer:** Layered approach: (1) Helmet sets 11+ security headers. (2) CORS restricts origins. (3) Rate limiting per route category. (4) JWT authentication on protected routes. (5) Role-based authorization. (6) Zod schema validation before business logic. (7) Prisma parameterized queries prevent SQL injection. (8) bcrypt for password storage. (9) SHA-256 for refresh token storage (plaintext never persisted).

### Q13: How does the checkout transaction work?
**Answer:** An ACID transaction via `prisma.$transaction()` with a 15-second timeout: (1) Validate stock for all cart items outside the transaction. (2) Compute prices with active promotions outside the transaction. (3) Enter transaction: reduce stock for each product, create Order + OrderItems, delete CartItems. (4) Commit. (5) After commit, `setImmediate` fires email notifications and cache invalidation asynchronously. If any step inside the transaction fails, all changes roll back.

### Q14: How do you prevent the N+1 query problem?
**Answer:** Prisma's `include` keyword performs JOIN queries, not separate queries per record. For example, `include: { items: { include: { product: { include: { images: true } } } } }` fetches an order and all its items and products in a single query.

### Q15: How is the email system decoupled?
**Answer:** Using Node's built-in `EventEmitter`. Services emit events like `emailEvents.emit('order.created', order)`. The email module listens for these events and sends the appropriate email. Services don't know how emails are sent — they just emit events. This means the email provider can be swapped (SMTP → SES → SendGrid) without touching business logic.

### Q16: How does auto token refresh work?
**Answer:** The Axios response interceptor catches `401` errors on non-auth routes. It sets `isRefreshing = true` and fires `/auth/refresh`. All other requests that fail with `401` during the refresh are queued. After refresh succeeds, all queued requests are retried with the new token. This prevents multiple simultaneous refresh calls — the **Failed Request Queue pattern**.

### Q17: What happens if the refresh token expires?
**Answer:** `/auth/refresh` returns an error. The Axios interceptor catches it, clears `localStorage`, and redirects to `/login`. The Zustand `authStore` is reset. The user must log in again.

### Q18: How do you handle account lockout?
**Answer:** Configurable via `SystemSettings.security`. On login failure: increment `failedLoginAttempts` on the User record. If `failedLoginAttempts >= failedLoginLimit`, set `lockoutUntil = now + lockDuration`. On next login attempt: check `lockoutUntil > now`; if so, return locked error. On successful login: reset `failedLoginAttempts` to 0.

### Q19: How do you manage database connections?
**Answer:** A single `PrismaClient` instance is exported from `lib/prisma.js`. Node's module system caches modules, so all imports share the same instance. This means Prisma manages a single connection pool, preventing connection exhaustion.

### Q20: What is the `tokenVersion` field for?
**Answer:** It's a stateless JWT revocation mechanism. Every JWT contains the `tokenVersion` at the time of issuance. The `protect` middleware verifies this: `decoded.tokenVersion !== user.tokenVersion → 401`. When a user changes their password, `tokenVersion` is incremented, invalidating all existing JWTs globally without maintaining a token blocklist.

### Q21: How do you handle concurrent wishlist toggles?
**Answer:** The `wishlistStore` uses a `pendingProducts` map as a per-product mutex. When `toggleWishlist(productId)` is called, it checks `pendingProducts[productId]`. If `true`, the call is immediately returned (no-op). Otherwise, the product is locked, the optimistic update fires, the API call is made, and the lock is released (success or failure).

### Q22: Why is `shippingAddress` stored as JSON in the Order table?
**Answer:** Address snapshotting. At order time, the address is copied as a JSON snapshot into the order record. If the user later updates or deletes their address, the historical order still shows the correct address as it was at the time of purchase. Using a foreign key would cause the order to show the updated address or break if the address is deleted.

### Q23: How do you handle file size limits on uploads?
**Answer:** Multer is configured with a `fileSize` limit (e.g., 5MB for product images). Files exceeding the limit return a 400 error before the upload even begins. Cloudinary also has configurable upload size limits at the CDN level.

### Q24: How is search implemented?
**Answer:** Server-side. Product search queries using Prisma's `contains` with `mode: 'insensitive'` across `name`, `description`, and `category` fields. Order search queries across `orderNumber`, `user.name`, and `user.email`. A `LIKE '%search%'` query in SQL with case-insensitive matching. For very large datasets, this should be replaced with full-text search (PostgreSQL `tsvector` or Elasticsearch).

### Q25: How do you ensure fresh data after a purchase?
**Answer:** After checkout, `homeCache.clear()` is called (via dynamic import to avoid circular deps) in a `setImmediate` background task. The next request to `/api/home` will recompute from the database. The cart store on the frontend is reset via `cartStore.resetCart()` and refetched on the next cart access.

### Q26: How does the design token system work?
**Answer:** Design tokens are defined in JS files under `src/theme/` (colors, typography, shadows, spacing). These are imported into `tailwind.config.js` and registered as Tailwind's `theme.extend` values. Every component uses Tailwind utility classes like `text-brand-600` or `bg-surface`. To change the brand color globally, only the token file needs to be updated.

### Q27: Why `Source Sans Pro` as the global font?
**Answer:** The font is loaded via Google Fonts in `index.html` and declared as the Tailwind `sans` family in `typography.js`. This propagates globally — every element that inherits from `font-sans` (which is applied to the root) uses Source Sans Pro.

### Q28: How does code splitting work?
**Answer:** Every page is wrapped in `React.lazy()`. React Router renders a `Suspense` boundary with a `LoadingSpinner` fallback. When a user navigates to `/admin/products` for the first time, only the `AdminProducts` chunk is downloaded. The initial JavaScript bundle is significantly smaller, improving TTI (Time to Interactive).

### Q29: What monitoring and observability is in place?
**Answer:** Currently: `SecurityLog` table captures auth events with IP/device context, `AuditLog` table captures admin settings changes, `EmailLog` table tracks email delivery status, console error logging for background task failures, rate limiter logs IPs of rate-limited requests. For production, distributed tracing (Datadog, Sentry) and structured JSON logging should be added.

### Q30: What are the main areas for improvement?
**Answer:** (1) Refresh token should be stored in HTTP-only cookies exclusively, not accessible to JavaScript. (2) Email verification should be enforced before login. (3) Full-text search with PostgreSQL `tsvector` for product search. (4) WebSocket or SSE for real-time order status updates. (5) Unit and integration test coverage. (6) Redis for server-side rate limit state (current `express-rate-limit` uses in-memory storage, which resets on restart). (7) A job queue (Bull/BullMQ) for reliable email delivery retries. (8) Image lazy loading and Intersection Observer for product galleries.

---

Additional Q&A topics your manager may raise:

- **Q31:** How would you add a new payment gateway? → Add a new `paymentMethod` handler in `orderRepository.executeCheckoutTransaction`, no schema changes needed since `paymentMethod` is a String field.
- **Q32:** How would you scale this to 100,000 concurrent users? → Add Redis for session storage + rate limiting, add read replicas (Neon supports this), introduce a CDN (Cloudflare), containerize with Docker, deploy behind a load balancer.
- **Q33:** How do promotions work? → Admin creates a Promotion with type, discount value, date range, and scope. At checkout, `promotionService.getActivePromotions()` fetches all active promotions; `promotionService.calculateProductPrice()` applies the highest-priority applicable promotion to each product.
- **Q34:** How does audit logging work? → `auditLogger.js` in services writes to `AuditLog` with `adminName`, `section`, `oldValue` (JSON snapshot before change), `newValue` (JSON snapshot after change), and `ipAddress`.
- **Q35:** Why `setImmediate` for post-checkout tasks? → `setImmediate` defers execution to the next iteration of the event loop, after I/O callbacks. This means the HTTP response is sent to the client immediately, and email sending and cache invalidation happen in the background without adding latency to the user's checkout experience.

---

## Strengths

1. **Enterprise-grade security:** Layered auth (JWT + Refresh), bcrypt, RBAC, rate limiting, Helmet, CORS, audit logs
2. **Optimistic UI everywhere:** Cart, wishlist, products, orders, customers — instant perceived performance
3. **Clean architecture:** Controller → Service → Repository separation enforced consistently
4. **Request lifecycle management:** AbortController + debounce + deduplication prevents all common async race conditions
5. **Database design:** Proper foreign keys, cascade rules, indexes on filtered columns, address snapshotting
6. **Dynamic settings:** No hardcoded configuration — JWT expiry, shipping charges, lockout rules all configurable at runtime
7. **Decoupled email:** EventEmitter pattern means email sending never blocks HTTP responses
8. **Code splitting:** Every admin and public page is a separate bundle chunk
9. **Design system:** Token-based Tailwind configuration makes global style changes a one-line edit
10. **ACID checkout:** Stock, order, and cart operations are atomic — no partial state corruption

---

## Areas for Future Improvement

| Priority | Item | Impact |
|----------|------|--------|
| High | HTTP-only cookies exclusively for refresh tokens | Eliminates XSS token theft risk |
| High | Enforce email verification before login | Prevents unverified account abuse |
| High | Unit and integration test suite | Regression prevention |
| High | Redis for rate limit state | Survives server restarts |
| Medium | Full-text search (tsvector) | Faster, smarter product search |
| Medium | Job queue for email delivery (BullMQ) | Reliable retry on SMTP failure |
| Medium | WebSocket / SSE for order updates | Real-time order status for customers |
| Medium | Structured JSON logging (Winston/Pino) | Production observability |
| Medium | API response caching with Redis | Reduce database load on read-heavy endpoints |
| Low | React Query / TanStack Query | Replaces custom deduplication/cache logic in stores |
| Low | PWA support | Offline capability, home screen install |
| Low | A/B testing framework | Conversion rate optimization |
| Low | GraphQL subscriptions | If real-time requirements increase |
