import userService from '../services/userService.js';
import { successResponse, errorResponse } from '../utils/response.js';

class UserController {
  async getProfile(req, res, next) {
    try {
      const user = await userService.getProfile(req.user.id);
      return successResponse(res, 'Profile retrieved successfully', { user }, 200);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await userService.getStats(req.user.id);
      return successResponse(res, 'Profile stats retrieved successfully', { stats }, 200);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      if (req.body.phone !== undefined) {
        if (!req.body.phone) {
          // Empty is fine if they want to clear it, but let's assume clearing is ok or checked elsewhere
        } else if (/[a-zA-Z]/.test(req.body.phone) || !/^[+\-\s0-9]{7,15}$/.test(req.body.phone)) {
          return errorResponse(res, 'Invalid phone number format', [], 400);
        }
      }

      const updatedUser = await userService.updateProfile(req.user.id, req.body);
      return successResponse(res, 'Profile updated successfully', { user: updatedUser }, 200);
    } catch (error) {
      next(error);
    }
  }

  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return errorResponse(res, 'No image file provided', [], 400);
      }
      const updatedUser = await userService.uploadAvatar(req.user.id, req.file);
      return successResponse(res, 'Avatar uploaded successfully', { user: updatedUser }, 200);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return errorResponse(res, 'Both current and new passwords are required', [], 400);
      }
      
      await userService.changePassword(req.user.id, currentPassword, newPassword);
      return successResponse(res, 'Password changed successfully', null, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
