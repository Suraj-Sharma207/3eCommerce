import authService from '../services/authService.js';
import { successResponse, errorResponse } from '../utils/response.js';

class AuthController {
  async register(req, res, next) {
    try {
      const data = await authService.register(req.body);
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
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      };
      
      const { user, accessToken, refreshToken, cookiesConfig } = await authService.login(req.body, reqInfo);
      
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: cookiesConfig.accessMaxAge
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: cookiesConfig.refreshMaxAge
      });

      // Maintain backward compatibility by returning token in response body as well temporarily
      return successResponse(res, 'Login successful', { user, token: accessToken }, 200);
    } catch (error) {
      if (error.message === 'Invalid email or password.' || error.message.includes('Account locked')) {
        return errorResponse(res, error.message, [], 401);
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
      if (req.cookies && req.cookies.refreshToken) {
        await authService.logout(req.cookies.refreshToken);
      }
      
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax'
      });
      
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax'
      });
      
      return successResponse(res, 'Logged out successfully', {}, 200);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user.id, currentPassword, newPassword);
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
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        return errorResponse(res, 'No refresh token provided', [], 401);
      }

      const reqInfo = {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      };

      const { accessToken, newRefreshToken, cookiesConfig } = await authService.refresh(refreshToken, reqInfo);

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: cookiesConfig.accessMaxAge
      });

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: cookiesConfig.refreshMaxAge
      });

      return successResponse(res, 'Token refreshed successfully', { token: accessToken }, 200);
    } catch (error) {
      // If refresh fails, clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return errorResponse(res, error.message || 'Invalid refresh token', [], 401);
    }
  }
}

export default new AuthController();
