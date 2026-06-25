import settingsService from '../services/settingsService.js';
import { successResponse } from '../utils/response.js';

class SettingsController {
  async getSettings(req, res, next) {
    try {
      const settings = await settingsService.getSettings();
      return successResponse(res, 'Settings retrieved', settings, 200);
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const settings = await settingsService.updateSettings(req.body);
      return successResponse(res, 'Settings updated successfully', settings, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new SettingsController();
