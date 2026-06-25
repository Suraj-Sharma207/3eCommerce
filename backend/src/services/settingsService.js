import settingsRepository from '../repositories/settingsRepository.js';

class SettingsService {
  async getSettings() {
    return await settingsRepository.getSettings();
  }

  async updateSettings(settingsData) {
    return await settingsRepository.updateSettings(settingsData);
  }
}

export default new SettingsService();
