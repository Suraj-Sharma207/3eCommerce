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
}

export default new UserController();
