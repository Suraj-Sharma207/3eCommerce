import authService from '../services/authService.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { getAuthCookieOptions, getClearCookieOptions, getAuthCookieNames } from '../utils/cookieConfig.js';
// M-3 FIX: Removed dead setCsrfCookie import — it was a documented no-op
import { verifyToken } from '../utils/jwt.js';
import prisma from '../lib/prisma.js';
import { cacheGet, cacheSet, cacheInvalidateByPattern } from '../services/cacheService.js';

class AuthController {
  async register(req, res, next) {
    try {
      const data = await authService.register(req.body);

      // H-1: Set auth cookies — never return token in JSON body
      // Registration currently does not create a session/refresh token,
      // so we only return user data. User must login separately.
      return successResponse(res, 'User registered successfully', data, 201);
    } catch (error) {
      if (error.message === 'User already exists') {
        return errorResponse(res, error.message, [], 400);
      }
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const reqInfo = {
        ip: req.ip || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent']
      };

      const { user, accessToken, refreshToken, cookiesConfig } = await authService.login(req.body, reqInfo);

      // Use dynamic cookie names supporting Host prefix
      const cookieNames = getAuthCookieNames(req);
      res.cookie(cookieNames.access, accessToken, getAuthCookieOptions(req, cookiesConfig.accessMaxAge));
      res.cookie(cookieNames.refresh, refreshToken, getAuthCookieOptions(req, cookiesConfig.refreshMaxAge));

      // Never expose token in JSON response body — cookies handle auth
      return successResponse(res, 'Login successful', { user }, 200);
    } catch (error) {
      if (error.message === 'Invalid email or password.' || error.message.includes('Account locked')) {
        return errorResponse(res, error.message, [], 401);
      }
      // L-5 FIX: Handle email verification error
      if (error.message.includes('verify your email')) {
        return errorResponse(res, error.message, [], 403);
      }
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user.id);
      return successResponse(res, 'User data retrieved', { user }, 200);
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const cookieNames = getAuthCookieNames(req);
      const clearOpts = getClearCookieOptions(req);

      // Always attempt session invalidation, even if cookie is missing.
      const refreshToken = req.cookies?.[cookieNames.refresh] || req.cookies?.refreshToken;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      // M-1 FIX: Invalidate session cache for the user on logout
      if (req.user?.id) {
        await cacheInvalidateByPattern(`user:session:${req.user.id}:*`);
      }

      // Always clear ALL auth cookies regardless of request state.
      res.clearCookie(cookieNames.access, clearOpts);
      res.clearCookie(cookieNames.refresh, clearOpts);

      // Clean up legacy cookies
      res.clearCookie('accessToken', clearOpts);
      res.clearCookie('refreshToken', clearOpts);
      res.clearCookie('XSRF-TOKEN', { ...clearOpts, httpOnly: false });

      return successResponse(res, 'Logged out successfully', {}, 200);
    } catch (error) {
      const cookieNames = getAuthCookieNames(req);
      const clearOpts = getClearCookieOptions(req);
      res.clearCookie(cookieNames.access, clearOpts);
      res.clearCookie(cookieNames.refresh, clearOpts);
      res.clearCookie('accessToken', clearOpts);
      res.clearCookie('refreshToken', clearOpts);
      res.clearCookie('XSRF-TOKEN', { ...clearOpts, httpOnly: false });
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user.id, currentPassword, newPassword);
      // M-1 FIX: Invalidate session cache for the user on password change
      await cacheInvalidateByPattern(`user:session:${req.user.id}:*`);
      return successResponse(res, 'Password changed successfully', {}, 200);
    } catch (error) {
      if (error.message === 'Invalid current password') {
        return errorResponse(res, error.message, [], 400);
      }
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      return successResponse(res, 'If your email is registered, a password reset link has been sent.', result, 200);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      const result = await authService.resetPassword(token, password);
      // Let it fall through, the user will log in again anyways since tokenVersion changed
      return successResponse(res, 'Password reset successfully', result, 200);
    } catch (error) {
      if (error.message === 'Invalid or expired password reset token') {
        return errorResponse(res, error.message, [], 400);
      }
      next(error);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const { token } = req.body;
      const result = await authService.verifyEmail(token);
      return successResponse(res, 'Email verified successfully', result, 200);
    } catch (error) {
      if (error.message === 'Invalid or expired email verification token') {
        return errorResponse(res, error.message, [], 400);
      }
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const cookieNames = getAuthCookieNames(req);
      const refreshToken = req.cookies?.[cookieNames.refresh] || req.cookies?.refreshToken;
      if (!refreshToken) {
        return errorResponse(res, 'No refresh token provided', [], 401);
      }

      const reqInfo = {
        ip: req.ip || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent']
      };

      const { accessToken, newRefreshToken, cookiesConfig } = await authService.refresh(refreshToken, reqInfo);

      res.cookie(cookieNames.access, accessToken, getAuthCookieOptions(req, cookiesConfig.accessMaxAge));
      res.cookie(cookieNames.refresh, newRefreshToken, getAuthCookieOptions(req, cookiesConfig.refreshMaxAge));

      // Never expose token in JSON response body
      return successResponse(res, 'Token refreshed successfully', {}, 200);
    } catch (error) {
      const cookieNames = getAuthCookieNames(req);
      const clearOpts = getClearCookieOptions(req);
      res.clearCookie(cookieNames.access, clearOpts);
      res.clearCookie(cookieNames.refresh, clearOpts);
      res.clearCookie('accessToken', clearOpts);
      res.clearCookie('refreshToken', clearOpts);
      res.clearCookie('XSRF-TOKEN', { ...clearOpts, httpOnly: false });
      // M-2 FIX: Distinguish replay attack from normal token expiry
      if (error.isReplayAttack) {
        return errorResponse(res, 'Session revoked due to security alert. Please login again.', [], 401);
      }
      return errorResponse(res, 'Invalid or expired refresh token', [], 401);
    }
  }

  async getSession(req, res, next) {
    try {
      let user = null;
      let authenticated = false;

      const cookieNames = getAuthCookieNames(req);
      const token = req.cookies?.[cookieNames.access];

      if (token) {
        const decoded = verifyToken(token);
        // M-9 FIX: Explicitly check token expiry claim exists
        if (decoded && decoded.exp) {
          const cacheKey = `user:session:${decoded.id}:${decoded.tokenVersion}`;
          const cachedSession = await cacheGet(cacheKey);

          if (cachedSession) {
            user = cachedSession.user;
            authenticated = cachedSession.authenticated;
          } else {
            user = await prisma.user.findUnique({
              where: { id: decoded.id },
              select: { id: true, name: true, email: true, role: true, tokenVersion: true }
            });
            // C-4 FIX: Verify tokenVersion matches — prevents stale sessions after password change or force-logout
            if (user && decoded.tokenVersion === user.tokenVersion) {
              authenticated = true;
              // Cache session status for 30 seconds to prevent DB hammer
              await cacheSet(cacheKey, { user, authenticated }, 30);
            } else {
              user = null;
            }
          }
        }
      }

      // Infer permissions from role (L-8: used for UI rendering hints only)
      const permissions = [];
      if (user?.role === 'SUPER_ADMIN') {
        permissions.push('all', 'admin', 'super_admin');
      } else if (user?.role === 'ADMIN') {
        permissions.push('admin');
      } else if (user?.role === 'CUSTOMER') {
        permissions.push('customer');
      }

      return successResponse(res, 'Session status retrieved', {
        authenticated,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions
        } : null
      }, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
