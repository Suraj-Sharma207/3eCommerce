import { successResponse, errorResponse } from '../utils/response.js';
import { env } from '../config/env.js';
import crypto from 'crypto';

class ChatbotController {
  /**
   * Proxy chat requests to the Python AI service.
   * Handles authentication implicitly (requires valid JWT via protect middleware).
   */
  async chat(req, res, next) {
    try {
      const { message, conversation_id } = req.body;

      if (!message || message.trim().length === 0) {
        return errorResponse(res, 'Message is required', [], 400);
      }

      // Build verified user context to pass to Python
      const userContext = req.user ? {
        user_id: req.user.id,
        user_name: req.user.name,
        user_email: req.user.email,
        user_role: req.user.role,
      } : null;

      const payload = {
        message,
        conversation_id,
        user_context: userContext,
      };

      const chatbotUrl = env.chatbotServiceUrl || 'http://localhost:8000';
      const apiKey = env.chatbotApiKey || '';

      const response = await fetch(`${chatbotUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Chatbot-API-Key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Chatbot] AI Service Error (${response.status}):`, errorText);
        return errorResponse(res, 'AI Assistant is currently unavailable', [], 503);
      }

      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      console.error('[Chatbot] Proxy Error:', error);
      next(error);
    }
  }

  /**
   * Health check proxy to the Python service.
   */
  async health(req, res, next) {
    try {
      const chatbotUrl = env.chatbotServiceUrl || 'http://localhost:8000';
      
      const response = await fetch(`${chatbotUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return res.status(503).json({ status: 'degraded', service: 'ai-chatbot-proxy' });
      }

      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      return res.status(503).json({ status: 'unavailable', service: 'ai-chatbot-proxy' });
    }
  }

  /**
   * Proxy admin requests to the Python AI service.
   * Requires admin privileges.
   */
  async proxyAdmin(req, res, next) {
    try {
      const path = req.originalUrl.replace('/api/chatbot', '');
      const chatbotUrl = env.chatbotServiceUrl || 'http://localhost:8000';
      const apiKey = env.chatbotApiKey || '';
      console.log('PROXY_ADMIN: path=', path, 'apiKey=', apiKey);

      const options = {
        method: req.method,
        headers: {
          'Content-Type': req.headers['content-type'] || 'application/json',
          'X-Chatbot-API-Key': apiKey,
        }
      };

      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        options.body = JSON.stringify(req.body);
      }

      const response = await fetch(`${chatbotUrl}${path}`, options);

      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = { message: await response.text() };
      }

      return res.status(response.status).json(data);
    } catch (error) {
      console.error('[Chatbot Admin Proxy Error]:', error);
      next(error);
    }
  }

  /**
   * Proxy manual bulk sync request to Python service
   */
  async bulkSync(req, res, next) {
    try {
      const chatbotUrl = env.chatbotServiceUrl || 'http://localhost:8000';
      const apiKey = env.chatbotApiKey || '';

      const response = await fetch(`${chatbotUrl}/sync/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Chatbot-API-Key': apiKey,
        }
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = { message: await response.text() };
      }

      return res.status(response.status).json(data);
    } catch (error) {
      console.error('[Chatbot Bulk Sync Error]:', error);
      next(error);
    }
  }

  /**
   * Internal proxy for Python to fetch user orders securely.
   * Called by the Python service via HTTP, verified by API key.
   */
  async getInternalOrders(req, res, next) {
    try {
      const { userId, limit = 5 } = req.query;
      if (!userId) return errorResponse(res, 'userId required', [], 400);

      // We dynamically import Prisma here to avoid circular dependencies if any
      const { default: prisma } = await import('../lib/prisma.js');
      
      const orders = await prisma.order.findMany({
        where: { userId },
        take: parseInt(limit, 10),
        orderBy: { createdAt: 'desc' },
        include: { 
          items: {
            include: { product: true }
          }
        }
      });

      return successResponse(res, 'Orders fetched', { orders }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Internal proxy for Python to fetch user cart.
   */
  async getInternalCart(req, res, next) {
    try {
      const { userId } = req.query;
      if (!userId) return errorResponse(res, 'userId required', [], 400);

      const { default: cartService } = await import('../services/cartService.js');
      const cart = await cartService.getCart(userId);

      return successResponse(res, 'Cart fetched', cart || { items: [] }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Internal proxy for Python to fetch user wishlist.
   */
  async getInternalWishlist(req, res, next) {
    try {
      const { userId } = req.query;
      if (!userId) return errorResponse(res, 'userId required', [], 400);

      const { default: prisma } = await import('../lib/prisma.js');
      
      const wishlist = await prisma.wishlist.findUnique({
        where: { userId },
        include: {
          items: {
            include: { product: true }
          }
        }
      });

      return successResponse(res, 'Wishlist fetched', wishlist || { items: [] }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Internal proxy for Python to fetch bulk products (Hydration).
   */
  async getInternalProductsBulk(req, res, next) {
    try {
      const { productIds } = req.body;
      if (!productIds || !Array.isArray(productIds)) {
        return errorResponse(res, 'productIds array required', [], 400);
      }

      const { default: prisma } = await import('../lib/prisma.js');
      
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1
          }
        }
      });

      return successResponse(res, 'Products fetched', { products }, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new ChatbotController();
