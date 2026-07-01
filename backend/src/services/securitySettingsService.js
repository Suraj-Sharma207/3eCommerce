import prisma from '../lib/prisma.js';

class SecuritySettingsService {
  async getSettings() {
    let settings = await prisma.systemSettings.findUnique({
      where: { key: 'SECURITY_SETTINGS' }
    });

    const defaultSettings = {
      sessionTimeout: '24h',
      jwtExpiry: '15m',
      refreshTokenExpiry: '30d',
      accountLockoutEnabled: true,
      failedLoginLimit: 5,
      lockDuration: '15m',
      rememberMeExpiry: '30d'
    };

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          key: 'SECURITY_SETTINGS',
          value: defaultSettings
        }
      });
    }

    return settings.value;
  }

  async updateSettings(newSettings) {
    const currentSettings = await this.getSettings();
    const updatedValue = { ...currentSettings, ...newSettings };

    const settings = await prisma.systemSettings.update({
      where: { key: 'SECURITY_SETTINGS' },
      data: { value: updatedValue }
    });

    return settings.value;
  }
}

export default new SecuritySettingsService();
