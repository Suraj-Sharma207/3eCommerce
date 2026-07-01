import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

// Import routes (will be created soon)
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/home', homeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/security', securityAdminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/sale-banner', saleBannerRoutes);
app.use('/api/shop-banner', shopBannerRoutes);

// Public endpoints
app.get('/api/branding', getBranding);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
