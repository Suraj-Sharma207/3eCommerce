import prisma from '../lib/prisma.js';

class SettingsRepository {
  async getSettings() {
    const settings = await prisma.setting.findMany();
    
    // Convert array of {key, value} to a single object
    const settingsObject = {};
    settings.forEach(s => {
      settingsObject[s.key] = s.value;
    });
    
    return settingsObject;
  }

  async updateSettings(settingsData) {
    const updates = [];
    
    for (const [key, value] of Object.entries(settingsData)) {
      updates.push(
        prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        })
      );
    }
    
    await prisma.$transaction(updates);
    return this.getSettings();
  }
}

export default new SettingsRepository();
