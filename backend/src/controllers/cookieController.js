import prisma from '../lib/prisma.js';
import { successResponse, errorResponse } from '../utils/response.js';

class CookieController {
  async updateConsent(req, res, next) {
    try {
      const { analytics, functional, marketing, necessary, version } = req.body;
      const userId = req.user.id;

      // Upsert the cookie consent for the user
      const consent = await prisma.cookieConsent.upsert({
        where: { userId },
        update: {
          analytics: Boolean(analytics),
          functional: Boolean(functional),
          marketing: Boolean(marketing),
          necessary: Boolean(necessary),
          version: version || '1.0',
          ip: req.ip || req.socket?.remoteAddress,
          browser: req.headers['user-agent']
        },
        create: {
          userId,
          analytics: Boolean(analytics),
          functional: Boolean(functional),
          marketing: Boolean(marketing),
          necessary: Boolean(necessary),
          version: version || '1.0',
          ip: req.ip || req.socket?.remoteAddress,
          browser: req.headers['user-agent']
        }
      });

      return successResponse(res, 'Cookie preferences updated successfully', { consent }, 200);
    } catch (error) {
      next(error);
    }
  }

  async getConsent(req, res, next) {
    try {
      const userId = req.user.id;
      const consent = await prisma.cookieConsent.findUnique({
        where: { userId }
      });

      if (!consent) {
        return successResponse(res, 'No cookie preferences found', { consent: null }, 200);
      }

      return successResponse(res, 'Cookie preferences retrieved', { consent }, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new CookieController();
