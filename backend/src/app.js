import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import { globalLimiter, authLimiter, adminLimiter, readLimiter } from './middleware/rateLimiter.js';

// Import routes
import { getBranding } from './controllers/brandingController.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import promotionRoutes from './routes/promotionRoutes.js';
import homeRoutes from './routes/homeRoutes.js';
import saleBannerRoutes from './routes/saleBannerRoutes.js';
import shopBannerRoutes from './routes/shopBannerRoutes.js';
import securityAdminRoutes from './routes/securityAdminRoutes.js';
import emailEvents from './email/utils/emailEvents.js';

const app = express();

// Trust Proxy Configuration
// Set based on environment. If behind Nginx/Cloudflare/ALB, TRUST_PROXY should be '1' or 'true'.
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy === 'true' || trustProxy === '1') {
  app.set('trust proxy', 1);
} else if (trustProxy) {
  app.set('trust proxy', trustProxy);
}

// Request logger for troubleshooting request cycles
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.originalUrl}`);
  next();
});

// Compression Middleware
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Security Middlewares
app.use(helmet());
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes with granular rate limiters
app.use('/api/home', readLimiter, homeRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', readLimiter, productRoutes);
app.use('/api/cart', globalLimiter, cartRoutes);
app.use('/api/wishlist', globalLimiter, wishlistRoutes);
app.use('/api/orders', globalLimiter, orderRoutes);
app.use('/api/admin/security', adminLimiter, securityAdminRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);
app.use('/api/users', globalLimiter, userRoutes);
app.use('/api/addresses', globalLimiter, addressRoutes);
app.use('/api/settings', readLimiter, settingsRoutes);
app.use('/api/promotions', readLimiter, promotionRoutes);
app.use('/api/sale-banner', readLimiter, saleBannerRoutes);
app.use('/api/shop-banner', readLimiter, shopBannerRoutes);

// Public endpoints
app.get('/api/branding', readLimiter, getBranding);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
