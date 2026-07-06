# Enterprise Flowchart Generation Audit Report
## PRIYAL | Home Appliances Pvt Ltd. — eCommerce Platform

---

> **Classification:** Technical Architecture & System Flowcharts  
> **Prepared For:** Principal Software Architect & Engineering Team  
> **Syntax Framework:** Mermaid (JS-based diagramming)

---

## 1. Complete System Architecture Overview

This diagram represents the overall system architecture, mapping execution boundaries from client interactions inside the browser to database execution in PostgreSQL.

```mermaid
flowchart TD
    subgraph ClientBrowser ["Client Browser Layer"]
        A["User Action (Click/Input)"]
        B["React UI (Virtual DOM)"]
        C["React Router (Client Routing)"]
        D["UI Components (Page/Layout)"]
        E["Zustand Stores (State)"]
        F["Axios Services (HTTP Wrapper)"]
        A --> B
        B --> C
        C --> D
        D --> E
        E --> F
    end

    subgraph NetworkProxy ["Network & Security Layer"]
        G["Axios Request Interceptor"]
        H["Reverse Proxy / SSL / CORS"]
        F --> G
        G --> H
    end

    subgraph ExpressServer ["Express Server Layer"]
        I["Helmet Security Headers"]
        J["Rate Limiters (Granular)"]
        K["Express JSON Body Parser"]
        L["cookie-parser (HTTP cookies)"]
        M["JWT protect Middleware"]
        N["Role authorize Middleware"]
        O["Zod Validation Middleware"]
        P["Express Routers"]
        Q["Controllers (Parse & Respond)"]
        R["Services (Business Rules)"]
        S["Repositories (DB Access)"]
        
        H --> I
        I --> J
        J --> K
        K --> L
        L --> M
        M --> N
        N --> O
        O --> P
        P --> Q
        Q --> R
        R --> S
    end

    subgraph DatabaseLayer ["Database Storage Layer"]
        T["Prisma Client ORM Engine"]
        U["Connection Pool Manager"]
        V[("PostgreSQL Database Server")]
        
        S --> T
        T --> U
        U --> V
    end
```

---

## 2. Frontend Architecture Mapping

This chart defines the layer dependencies on the client-side, showing how pages are assembled and how state flows to the API service wrapper.

```mermaid
flowchart TD
    Pages["1. Page Components (src/pages/*)"]
    Layouts["2. Layouts (PublicLayout, AdminLayout)"]
    Components["3. Shared Components (src/components/ui/*)"]
    Hooks["4. Custom Hooks (useAdminFilters, etc.)"]
    Stores["5. Zustand Global Stores (src/store/*)"]
    Services["6. API Service Wrappers (src/services/*)"]
    AxiosInstance["7. Axios Client Singleton (api.js)"]

    Pages --> Layouts
    Pages --> Components
    Pages --> Hooks
    Layouts --> Components
    Components --> Stores
    Hooks --> Stores
    Stores --> Services
    Services --> AxiosInstance
```

---

## 3. Authentication Flows

### Registration Lifecycle

```mermaid
flowchart TD
    RegStart["User Fills Form"]
    Validation["Client Regex Validation"]
    Submit["Axios POST /api/auth/register"]
    Middlewares["Express Middleware Chain"]
    ZodValidate["Zod Schema Verification"]
    DuplicateCheck["Check Email Conflicts"]
    BcryptHash["Hash Password (bcrypt 10 rounds)"]
    DBSave["Save User with verified: false"]
    VerificationLink["Verification Link Token Generated"]
    SendEmail["Emit verification_requested event"]
    SMTPDeliver["SMTP Send via Handlebars"]
    TokenSign["Sign Access JWT"]
    SetCookies["Set Client Token Cookies"]
    Dashboard["Redirect to Homepage/Dashboard"]

    RegStart --> Validation
    Validation --> Submit
    Submit --> Middlewares
    Middlewares --> ZodValidate
    ZodValidate --> DuplicateCheck
    DuplicateCheck --> BcryptHash
    BcryptHash --> DBSave
    DBSave --> VerificationLink
    VerificationLink --> SendEmail
    SendEmail --> SMTPDeliver
    DBSave --> TokenSign
    TokenSign --> SetCookies
    SetCookies --> Dashboard
```

### Login, Sessions, and Lockout

```mermaid
flowchart TD
    LoginStart["POST /api/auth/login"]
    CheckLockout["Query DB: Account locked out?"]
    LockoutAlert["Return 403 Account Locked"]
    FetchUser["Find User by Email"]
    VerifyPass["bcrypt.compare(pass, hash)"]
    SuccessLogin["Reset failedLoginAttempts"]
    CreateSession["Create Session record in database"]
    SignToken["Sign Access JWT (expires in 15m)"]
    WriteCookie["Set HTTP-only Cookies"]
    IncrementFail["Increment failedLoginAttempts"]
    CheckThreshold["Attempts >= limit?"]
    LockAccount["Set lockoutUntil = now + duration"]
    ReturnUnauthorized["Return 401 Invalid Credentials"]

    LoginStart --> CheckLockout
    CheckLockout -->|Yes| LockoutAlert
    CheckLockout -->|No| FetchUser
    FetchUser --> VerifyPass
    VerifyPass -->|Success| SuccessLogin
    SuccessLogin --> CreateSession
    CreateSession --> SignToken
    SignToken --> WriteCookie
    VerifyPass -->|Failed| IncrementFail
    IncrementFail --> CheckThreshold
    CheckThreshold -->|Yes| LockAccount
    CheckThreshold -->|No| ReturnUnauthorized
    LockAccount --> ReturnUnauthorized
```

### Logout and Token Invalidation

```mermaid
flowchart TD
    LogoutStart["POST /api/auth/logout"]
    GetCookie["Extract refreshToken cookie"]
    HashToken["SHA-256 Hash token value"]
    DeleteSession["Delete Session row matching hash"]
    ClearClientCookies["Clear client cookies"]
    ClearStore["Reset Zustand Auth Store state"]
    RedirectLogin["Redirect client to /login"]

    LogoutStart --> GetCookie
    GetCookie --> HashToken
    HashToken --> DeleteSession
    DeleteSession --> ClearClientCookies
    ClearClientCookies --> ClearStore
    ClearStore --> RedirectLogin
```

### Silent Refresh & 401 Retry Queue

```mermaid
flowchart TD
    APIReq["Send Axios Request"]
    Recv401["Receive 401 Unauthorized Response"]
    CheckRoute["Is it an excluded auth route?"]
    ForwardErr["Forward 401 to UI page handler"]
    CheckRefresh["Is refreshing token lock true?"]
    QueueReq["Queue current request config"]
    SetLock["Set refreshing token lock = true"]
    SendRefresh["POST /api/auth/refresh"]
    DBVerifySession["Match Session hash in database"]
    CheckExpiry["Is session expired?"]
    ForceLogout["Delete Cookies, Redirect to Login"]
    RotateToken["Rotate token, write cookies"]
    Unlock["Set refreshing token lock = false"]
    RetryQueue["Flush queue and retry requests"]

    APIReq --> Recv401
    Recv401 --> CheckRoute
    CheckRoute -->|Yes| ForwardErr
    CheckRoute -->|No| CheckRefresh
    CheckRefresh -->|Yes| QueueReq
    CheckRefresh -->|No| SetLock
    SetLock --> SendRefresh
    SendRefresh --> DBVerifySession
    DBVerifySession --> CheckExpiry
    CheckExpiry -->|Expired| ForceLogout
    CheckExpiry -->|Valid| RotateToken
    RotateToken --> Unlock
    Unlock --> RetryQueue
```

---

## 4. Product Catalog Flow

This flow maps search, filtering, pagination, and data loading for the shop's product listing.

```mermaid
flowchart TD
    ListingMount["ProductList Mounts"]
    ReadParams["Read URLSearchParams"]
    AbortStale["Abort in-flight search request"]
    FetchState["Set productStore.isLoading = true"]
    AxiosCall["GET /api/products (with params & signal)"]
    CtrlHandler["productController.getProducts"]
    BuildQuery["Build Prisma query object"]
    RunParallel["Promise.all: query and count"]
    FetchProducts["Prisma findMany (with skip/take)"]
    CountTotal["Prisma count matching total"]
    ReturnPayload["Return products array + pagination"]
    StoreUpdate["Update productStore state"]
    UIRender["Re-render ProductCards & Pagination UI"]

    ListingMount --> ReadParams
    ReadParams --> AbortStale
    AbortStale --> FetchState
    FetchState --> AxiosCall
    AxiosCall --> CtrlHandler
    CtrlHandler --> BuildQuery
    BuildQuery --> RunParallel
    RunParallel --> FetchProducts
    RunParallel --> CountTotal
    FetchProducts --> ReturnPayload
    CountTotal --> ReturnPayload
    ReturnPayload --> StoreUpdate
    StoreUpdate --> UIRender
```

---

## 5. Wishlist Mutex Toggle Flow

This flowchart illustrates the optimistic toggle mechanism, request locking, and failure rollback loop.

```mermaid
flowchart TD
    UserClick["User clicks Heart icon"]
    CheckLock["Is product ID locked in pendingProducts?"]
    Ignore["Ignore click (no-op)"]
    SetLock["Set pendingProducts[productId] = true"]
    SaveState["Save current wishlist state backup"]
    UIUpdate["Optimistic Update: Heart Fills in UI"]
    SendAPI["POST /api/wishlist/toggle { productId }"]
    CheckSuccess["Was API call successful?"]
    Unlock["Set pendingProducts[productId] = false"]
    SaveResponse["Save returned database state"]
    UIRollback["Rollback Heart UI to original state"]
    ShowToast["Show warning toast notification"]

    UserClick --> CheckLock
    CheckLock -->|Yes| Ignore
    CheckLock -->|No| SetLock
    SetLock --> SaveState
    SaveState --> UIUpdate
    UIUpdate --> SendAPI
    SendAPI --> CheckSuccess
    CheckSuccess -->|Success| SaveResponse
    SaveResponse --> Unlock
    CheckSuccess -->|Failed| UIRollback
    UIRollback --> Unlock
    Unlock --> ShowToast
```

---

## 6. Cart Flow & Debounce Mechanism

```mermaid
flowchart TD
    QtyChange["User clicks quantity adjustment (+/-)"]
    SaveBackup["Save backup of previous cart state"]
    UIQtyUpdate["Update Quantity and Subtotal in UI"]
    ClearTimer["Clear active update timeout"]
    SetTimer["Set 300ms update timeout"]
    TimerFires["Timeout timer fires"]
    AbortPending["Abort pending requests for this product"]
    SendAPI["PUT /api/cart/items/:id { quantity }"]
    CheckSuccess["Was request successful?"]
    SaveCart["Update cart state with server response"]
    RollbackCart["Rollback cart state to backup"]
    ErrorToast["Display error toast notification"]

    QtyChange --> SaveBackup
    SaveBackup --> UIQtyUpdate
    UIQtyUpdate --> ClearTimer
    ClearTimer --> SetTimer
    SetTimer -->|Wait 300ms| TimerFires
    TimerFires --> AbortPending
    AbortPending --> SendAPI
    SendAPI --> CheckSuccess
    CheckSuccess -->|Success| SaveCart
    CheckSuccess -->|Failed| RollbackCart
    RollbackCart --> ErrorToast
```

---

## 7. Checkout ACID Transaction Flow

This chart shows the steps of the order checkout process, which runs inside a database transaction to ensure data consistency.

```mermaid
flowchart TD
    CheckoutBtn["User clicks Place Order"]
    SubmitCheckout["POST /api/orders/checkout"]
    PreCheck["Verify coupon validity & compute prices"]
    CheckDBStock["Fetch products to verify stock levels"]
    VerifyQuantity["Is stock available?"]
    RejectCheckout["Return 422 Out of Stock"]
    BeginTx["Prisma $transaction()"]
    LockRows["Lock product database rows"]
    SubtractStock["Subtract stock values in DB"]
    CreateOrder["Create Order (with JSON Address snapshot)"]
    CreateItems["Create OrderItem records"]
    DeleteCart["Delete User's CartItem records"]
    CommitTx["Commit Transaction"]
    OnSuccess["Order confirmed successfully"]
    EmailEvent["Emit order.created email event"]
    ResetCartStore["Clear client cart Zustand store"]
    SuccessPage["Redirect user to /order-success/:id"]
    OnFailure["Rollback database transaction"]
    ShowFailToast["Show order placement failure toast"]

    CheckoutBtn --> SubmitCheckout
    SubmitCheckout --> PreCheck
    PreCheck --> CheckDBStock
    CheckDBStock --> VerifyQuantity
    VerifyQuantity -->|No| RejectCheckout
    VerifyQuantity -->|Yes| BeginTx
    BeginTx --> LockRows
    LockRows --> SubtractStock
    SubtractStock --> CreateOrder
    CreateOrder --> CreateItems
    CreateItems --> DeleteCart
    DeleteCart --> CommitTx
    CommitTx -->|Success| OnSuccess
    OnSuccess --> EmailEvent
    OnSuccess --> ResetCartStore
    ResetCartStore --> SuccessPage
    CommitTx -->|Failed| OnFailure
    OnFailure --> ShowFailToast
```

---

## 8. Customer Address Lifecycle

```mermaid
flowchart TD
    FormInput["User enters Address details"]
    PhoneFormat["Format phone input using E.164"]
    Submit["POST /api/addresses"]
    ZodCheck["Validate body using addressSchema"]
    CtrlCall["addressController.createAddress"]
    CheckDefault["Is set as default address?"]
    ResetOthers["Set isDefault flag to false on other records"]
    SaveDB["Insert Address record into PostgreSQL"]
    Send201["Return 201 Created JSON"]
    AppendStore["Append address to addressStore state"]
    UIRender["Update Address Book grid views"]

    FormInput --> PhoneFormat
    PhoneFormat --> Submit
    Submit --> ZodCheck
    ZodCheck --> CtrlCall
    CtrlCall --> CheckDefault
    CheckDefault -->|Yes| ResetOthers
    ResetOthers --> SaveDB
    CheckDefault -->|No| SaveDB
    SaveDB --> Send201
    Send201 --> AppendStore
    AppendStore --> UIRender
```

---

## 9. Admin Dashboard Analytics Caching Flow

```mermaid
flowchart TD
    AdminClick["Admin lands on Dashboard"]
    ReadCache["Read analytics cache from store"]
    CheckTTL["Is cache timestamp < 5 minutes old?"]
    LoadUI["Render UI from cached data"]
    AbortPending["Abort active dashboard analytics request"]
    SetLoad["Set isLoading = true"]
    FetchData["GET /api/admin/dashboard"]
    DBAggregate["Run Prisma aggregate database queries"]
    FormatResponse["Format response data structure"]
    StoreUpdate["Update store and set cache timestamp"]
    UIRefresh["Refresh Dashboard KPIs and Charts"]

    AdminClick --> ReadCache
    ReadCache --> CheckTTL
    CheckTTL -->|Yes| LoadUI
    CheckTTL -->|No| AbortPending
    AbortPending --> SetLoad
    SetLoad --> FetchData
    FetchData --> DBAggregate
    DBAggregate --> FormatResponse
    FormatResponse --> StoreUpdate
    StoreUpdate --> UIRefresh
```

---

## 10. CRUD Flow (Product CRUD Lifecycle)

```mermaid
flowchart TD
    subgraph CreateFlow ["1. CREATE PRODUCT"]
        CA["Admin submits form"] --> CB["Zod Validation Check"]
        CB --> CC["POST /api/products"]
        CC --> CD["Insert record via Prisma"]
        CD --> CE["Append to productStore"]
        CE --> CF["Show creation success toast"]
    end

    subgraph ReadFlow ["2. READ PRODUCTS"]
        RA["Catalog Mounts"] --> RB["GET /api/products?page=1"]
        RB --> RC["Prisma findMany query"]
        RC --> RD["Set products in productStore"]
        RD --> RE["Render products table/grid"]
    end

    subgraph UpdateFlow ["3. UPDATE PRODUCT"]
        UA["Submit edit changes"] --> UB["PUT /api/products/:id"]
        UB --> UC["Update record via Prisma"]
        UC --> UD["Update item in productStore"]
        UD --> UE["Show edit success toast"]
    end

    subgraph DeleteFlow ["4. DELETE PRODUCT"]
        DA["Click delete button"] --> DB["Verify order history associations"]
        DB --> DC["DELETE /api/products/:id"]
        DC --> DD["Delete record via Prisma"]
        DD --> DE["Remove item from productStore"]
        DE --> DF["Show deletion success toast"]
    end
```

---

## 11. Backend Request Lifecycle

This diagram maps the path of an incoming HTTP request through the backend middlewares and routers.

```mermaid
flowchart TD
    Req["Incoming HTTP Request"]
    Helmet["1. Helmet (Security Headers)"]
    ReqID["2. Request ID Generator (X-Request-ID)"]
    CORS["3. CORS Validator (Origin Check)"]
    RateLimiter["4. Rate Limiter (IP Rate Check)"]
    BodyParser["5. JSON Body Parser"]
    CookieParser["6. cookie-parser"]
    JWTProtect["7. JWT protect Middleware (Verify User)"]
    RBAC["8. role authorize Middleware"]
    ZodCheck["9. Zod Input Validator"]
    Router["10. Express Router Match"]
    Controller["11. Controller Method Dispatch"]
    Service["12. Service Layer (Business Logic)"]
    Repository["13. Repository Layer (Prisma SQL)"]
    DB[("PostgreSQL Database")]
    Respond["14. HTTP JSON Response (successResponse)"]

    Req --> Helmet
    Helmet --> ReqID
    ReqID --> CORS
    CORS --> RateLimiter
    RateLimiter --> BodyParser
    BodyParser --> CookieParser
    CookieParser --> JWTProtect
    JWTProtect --> RBAC
    RBAC --> ZodCheck
    ZodCheck --> Router
    Router --> Controller
    Controller --> Service
    Service --> Repository
    Repository --> DB
    DB --> Respond
```

---

## 12. Middleware Stack Flow

```mermaid
flowchart TD
    subgraph GlobalMiddlewares ["Global Middleware Stack"]
        GA["helmet()"]
        GB["cors()"]
        GC["express.json()"]
        GD["cookieParser()"]
        GA --> GB
        GB --> GC
        GC --> GD
    end

    subgraph RouteMiddlewares ["Route Specific Middlewares"]
        RA["rateLimit()"]
        RB["protect()"]
        RC["authorize('ADMIN')"]
        RD["validate(schema)"]
        RE["upload.single('avatar')"]
        
        RA --> RB
        RB --> RC
        RC --> RD
        RD --> RE
    end

    GD --> RA
```

---

## 13. File Upload Flow (Cloudinary Stream)

```mermaid
flowchart TD
    FileSelect["Admin selects Image file"]
    FormAppend["Append file data to FormData object"]
    SubmitCall["POST /api/products/:id/images"]
    MulterInter["Multer Middleware intercepts request"]
    CloudStream["Stream file directly to Cloudinary API"]
    CDNWrite["Cloudinary saves file, returns URL & publicId"]
    SaveDB["Insert ProductImage record via Prisma"]
    Response["Return 200 OK with Image URL"]
    AppendStore["Append Image URL to productStore state"]
    UIRender["Refresh image gallery preview in interface"]

    FileSelect --> FormAppend
    FormAppend --> SubmitCall
    SubmitCall --> MulterInter
    MulterInter --> CloudStream
    CloudStream --> CDNWrite
    CDNWrite --> SaveDB
    SaveDB --> Response
    Response --> AppendStore
    AppendStore --> UIRender
```

---

## 14. Query Flow (Prisma to SQL Translation)

```mermaid
flowchart TD
    RepoCall["Repository calls Prisma Client method"]
    PrismaQuery["Prisma Client compiles Query Object"]
    QueryEngine["Prisma Query Engine processes query"]
    SQLCompile["Compile to parameterized SQL string"]
    PoolAcquire["Acquire connection from database pool"]
    SQLExec["Execute SQL query on PostgreSQL database"]
    RowsReturned["PostgreSQL returns matching table rows"]
    ObjectMapping["Map database rows to Javascript objects"]
    ConnectionRelease["Release connection back to pool"]
    RepoResponse["Repository returns mapped object"]

    RepoCall --> PrismaQuery
    PrismaQuery --> QueryEngine
    QueryEngine --> SQLCompile
    SQLCompile --> PoolAcquire
    PoolAcquire --> SQLExec
    SQLExec --> RowsReturned
    RowsReturned --> ObjectMapping
    ObjectMapping --> ConnectionRelease
    ConnectionRelease --> RepoResponse
```

---

## 15. State Management Flow (Zustand Stores)

This flowchart illustrates how Zustand state changes trigger React component renders.

```mermaid
flowchart TD
    ComponentMount["Component mounts, subscribes to Store selectors"]
    ActionInvoke["User action calls store action method"]
    APICall["Axios request handles API communication"]
    LocalSet["set() modifies state properties in memory"]
    DiffCheck["Zustand selector detects property reference changes"]
    ReRender["Trigger React Virtual DOM re-render"]
    DOMSync["Sync differences to browser DOM"]

    ComponentMount --> ActionInvoke
    ActionInvoke --> APICall
    APICall --> LocalSet
    LocalSet --> DiffCheck
    DiffCheck -->|Changed| ReRender
    ReRender --> DOMSync
```

---

## 16. Sequence Diagrams

### 1. User Authentication (Login Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant View as LoginPage
    participant Store as authStore
    participant Service as authService
    participant Axios as api.js
    participant Router as Express Router
    participant CTRL as authController
    participant Repo as userRepository
    participant DB as PostgreSQL (via Prisma)

    User->>View: Enter details, click Login
    View->>View: Run form validators
    View->>Store: login({ email, password })
    Store->>Store: Set isLoading = true
    Store->>Service: login(credentials)
    Service->>Axios: post('/auth/login', credentials)
    Axios->>Router: POST /api/auth/login
    Router->>CTRL: login(req, res)
    CTRL->>Repo: findByEmail(email)
    Repo->>DB: query user where email
    DB-->>Repo: user record
    Repo-->>CTRL: user object
    CTRL->>CTRL: verify password hash (bcrypt)
    CTRL->>Repo: createSession(userId, tokenHash, ip, device)
    DB-->>Repo: Session created
    CTRL-->>Axios: 200 OK (user, accessToken, cookie refresh)
    Axios-->>Service: parsed response
    Service-->>Store: response payload
    Store->>Store: Set user state, isAuthenticated = true
    Store-->>View: State updated
    View-->>User: Redirect to Homepage/Dashboard
```

---

### 2. Wishlist Toggle Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Card as ProductCard (UI)
    participant Store as wishlistStore
    participant Axios as api.js
    participant CTRL as wishlistController
    participant Repo as wishlistRepository
    participant DB as PostgreSQL

    User->>Card: Click Wishlist Heart icon
    Card->>Store: toggleWishlist(productId)
    Note over Store: Check mutex lock pendingProducts[id]
    Store->>Store: Set pendingProducts[productId] = true
    Store->>Store: Optimistic Update: Fill heart icon in UI
    Store->>Axios: post('/wishlist/toggle', { productId })
    Axios->>CTRL: POST /api/wishlist/toggle
    CTRL->>Repo: toggleItem(userId, productId)
    Repo->>DB: create or delete WishlistItem
    DB-->>Repo: updated records
    Repo-->>CTRL: updated items
    CTRL-->>Axios: 200 OK (wishlist data)
    Axios-->>Store: new wishlist state
    Store->>Store: Set wishlist state, set lock = false
    Store-->>Card: Sync filled Heart icon state
```

---

### 3. Cart Quantity Update Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant View as CartPage (UI)
    participant Store as cartStore
    participant Axios as api.js
    participant CTRL as cartController
    participant Repo as cartRepository
    participant DB as PostgreSQL

    User->>View: Click Quantity Plus (+) button
    View->>Store: updateQuantity(productId, newQty)
    Store->>Store: Save backup of previous state
    Store->>Store: Optimistic Update: Update cart totals in UI
    Note over Store: Debounce: Clear previous timer, set 300ms delay
    Note over Store: Delay completes, timer fires
    Store->>Axios: PUT /cart/items/:id (with AbortController signal)
    Axios->>CTRL: PUT /api/cart/items/:id
    CTRL->>Repo: updateItemQuantity(userId, productId, qty)
    Repo->>DB: update quantity row
    DB-->>Repo: updated cart row
    Repo-->>CTRL: current cart items
    CTRL-->>Axios: 200 OK (updated cart data)
    Axios-->>Store: new cart state
    Store->>Store: Save verified items & clear loading state
    Store-->>View: State sync complete
```

---

### 4. Checkout Order Creation Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant View as CheckoutPage (UI)
    participant Store as orderStore
    participant Axios as api.js
    participant CTRL as orderController
    participant Service as orderService
    participant Repo as orderRepository
    participant DB as PostgreSQL
    participant Email as EmailSubsystem

    User->>View: Click Place Order button
    View->>Store: createOrder(orderData)
    Store->>Axios: post('/orders/checkout', orderData)
    Axios->>CTRL: POST /api/orders/checkout
    CTRL->>Service: createOrder(userId, orderData)
    Service->>Repo: executeCheckoutTransaction(userId, data)
    Repo->>DB: Begin $transaction()
    Note over DB: Lock product rows & verify stock levels
    DB->>DB: Subtract product stock
    DB->>DB: Create Order & OrderItems
    DB->>DB: Delete CartItems
    Repo->>DB: Commit transaction
    DB-->>Repo: transaction committed
    Repo-->>Service: order details
    Service->>Email: Emit 'order.created' event
    Email-->>User: SMTP order confirmation email sent
    Service-->>CTRL: order object
    CTRL-->>Axios: 201 Created (order data)
    Axios-->>Store: save order
    Store->>Store: Clear client cart Zustand store
    Store-->>View: Redirect to Success Page
```

---

### 5. Admin Product CRUD Sequence Diagram (Creation)

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant View as AdminProducts (UI)
    participant Store as productStore
    participant Axios as api.js
    participant CTRL as productController
    participant Service as productService
    participant Repo as productRepository
    participant DB as PostgreSQL

    Admin->>View: Submit new product form
    View->>Store: createProduct(productData)
    Store->>Axios: post('/products', productData)
    Axios->>CTRL: POST /api/products
    CTRL->>Service: createProduct(productData)
    Service->>Repo: create(productData)
    Repo->>DB: insert Product record
    DB-->>Repo: product record
    Repo-->>Service: product object
    Service-->>CTRL: product object
    CTRL-->>Axios: 201 Created (new product)
    Axios-->>Store: append new product to products array
    Store-->>View: UI table updates, display success toast
```

---

## 17. Master Architecture Subsystem Overview

This diagram represents how the front-end, state management, HTTP services, security middleware, and database layers integrate across the enterprise platform.

```mermaid
flowchart TB
    subgraph ClientLayer ["CLIENT SUBSYSTEM (React SPA)"]
        C1["Public Pages (Shop, Cart)"]
        C2["Admin Pages (Dashboard, Settings)"]
        C3["Shared UI Components (Inputs, Buttons)"]
        C4["Zustand State Stores"]
        C5["Axios Client Wrapper (api.js)"]
        
        C1 --> C3
        C2 --> C3
        C3 --> C4
        C4 --> C5
    end

    subgraph SecurityLayer ["SECURITY & NETWORK GATEWAY"]
        S1["CORS Origin Validator"]
        S2["Granular Rate Limiters"]
        S3["JWT Verification (protect)"]
        S4["Role Authorization (authorize)"]
        
        S1 --> S2
        S2 --> S3
        S3 --> S4
    end

    subgraph ServiceLayer ["BACKEND APPLICATION SUBSYSTEM (Express.js)"]
        B1["Express Router Handler"]
        B2["Zod Schema Validation Middleware"]
        B3["Controller Dispatch Layer"]
        B4["Business Logic Services"]
        B5["Repository Database Operations"]
        
        B1 --> B2
        B2 --> B3
        B3 --> B4
        B4 --> B5
    end

    subgraph ResourceLayer ["RESOURCE & STORAGE INTEGRATIONS"]
        DB[("PostgreSQL Database (Neon Serverless)")]
        IMG["Cloudinary CDN Image Storage"]
        MAIL["SMTP Nodemailer Services"]
    end

    C5 -->|REST HTTPS Requests| S1
    S4 --> B1
    B5 -->|Prisma Client SQL| DB
    B4 -->|File Stream Uploads| IMG
    B4 -->|EventEmitter emailEvents| MAIL
```
