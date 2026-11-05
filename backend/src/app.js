import express from "express";
import cors from "cors";
import helmet from "helmet";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import compression from "compression";
import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware.js";
import {
  globalLimiter,
  authLimiter,
  adminLimiter,
  readLimiter,
} from "./middleware/rateLimiter.js";
import { csrfProtection } from "./middleware/csrfMiddleware.js";

// Import routes
import { getBranding } from "./controllers/brandingController.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import promotionRoutes from "./routes/promotionRoutes.js";
import homeRoutes from "./routes/homeRoutes.js";
import saleBannerRoutes from "./routes/saleBannerRoutes.js";
import shopBannerRoutes from "./routes/shopBannerRoutes.js";
import securityAdminRoutes from "./routes/securityAdminRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import emailEvents from "./email/utils/emailEvents.js";

const app = express();

// Trust Proxy Configuration
// Set based on environment. If behind Nginx/Cloudflare/ALB, TRUST_PROXY should be '1' or 'true'.
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy === "true" || trustProxy === "1") {
  app.set("trust proxy", 1);
} else if (trustProxy) {
  app.set("trust proxy", trustProxy);
}

// Phase 10: Sanitized request logger — masks sensitive headers
const SENSITIVE_HEADERS = new Set(["authorization", "cookie", "x-xsrf-token"]);
app.use((req, res, next) => {
  // Log only method and path — never log headers, query params with tokens, or body
  console.log(`[HTTP] ${req.method} ${req.path}`);
  next();
});

// Phase 3: Compression middleware — removed public x-no-compression bypass.
// Only the default compression filter is used (based on content type).
app.use(compression());

// Security Middlewares
app.use(helmet());
app.use((req, res, next) => {
  req.id = req.headers["x-request-id"] || crypto.randomUUID();
  res.setHeader("X-Request-ID", req.id);
  next();
});
const getAllowedOrigins = () => {
  const envUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  return envUrl
    .split(",")
    .map((url) => url.trim().replace(/\/+$/, "").toLowerCase())
    .filter(Boolean);
};

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.trim().replace(/\/+$/, "").toLowerCase();
      const origins = getAllowedOrigins();

      const isAllowed =
        origins.includes(normalizedOrigin) ||
        origins.includes("*") ||
        (normalizedOrigin.endsWith(".vercel.app") && origins.some((o) => o.includes("vercel.app")));

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// Phase 3: Explicit request body size limits
// L-6 FIX: Reduced from 5mb to 500kb to prevent large-payload DoS
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

// H-3: CSRF protection — validates X-XSRF-TOKEN header on state-changing requests.
// Must be after cookieParser so it can read the XSRF-TOKEN cookie.
app.use(csrfProtection);

// Routes with granular rate limiters
app.use("/api/home", readLimiter, homeRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/products", readLimiter, productRoutes);
app.use("/api/cart", globalLimiter, cartRoutes);
app.use("/api/wishlist", globalLimiter, wishlistRoutes);
app.use("/api/orders", globalLimiter, orderRoutes);
app.use("/api/admin/security", adminLimiter, securityAdminRoutes);
app.use("/api/admin", adminLimiter, adminRoutes);
app.use("/api/users", globalLimiter, userRoutes);
app.use("/api/addresses", globalLimiter, addressRoutes);
app.use("/api/settings", readLimiter, settingsRoutes);
app.use("/api/promotions", readLimiter, promotionRoutes);
app.use("/api/sale-banner", readLimiter, saleBannerRoutes);
app.use("/api/shop-banner", readLimiter, shopBannerRoutes);
app.use("/api/chatbot", globalLimiter, chatbotRoutes);

// Public endpoints
app.get("/api/branding", readLimiter, getBranding);

// Health check endpoint
// L-7 FIX: Added rate limiter to prevent unthrottled probing
app.get("/health", readLimiter, (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
