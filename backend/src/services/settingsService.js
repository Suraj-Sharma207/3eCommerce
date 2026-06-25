import prisma from '../lib/prisma.js';
import { encrypt, decrypt } from '../utils/crypto.js';

class SettingsService {
  async getSettingsByKeys(keys) {
    const settings = await prisma.systemSettings.findMany({
      where: { key: { in: keys } }
    });
    
    const settingsObject = {};
    keys.forEach(k => {
      settingsObject[k] = {}; // Default empty object
    });

    settings.forEach(s => {
      // Decrypt sensitive fields if this is a payment setting
      if (s.key === 'payment' && s.value) {
        if (s.value.stripeSecretKey) {
          s.value.stripeSecretKey = decrypt(s.value.stripeSecretKey);
        }
        if (s.value.razorpayKeySecret) {
          s.value.razorpayKeySecret = decrypt(s.value.razorpayKeySecret);
        }
      }
      if (s.key === 'smtp' && s.value && s.value.password) {
        s.value.password = decrypt(s.value.password);
      }
      
      settingsObject[s.key] = s.value;
    });
    
    return settingsObject;
  }

  async updateSettings(domain, data) {
    let finalData = { ...data };

    // Encrypt sensitive fields
    if (domain === 'payment') {
      if (finalData.stripeSecretKey) {
        finalData.stripeSecretKey = encrypt(finalData.stripeSecretKey);
      }
      if (finalData.razorpayKeySecret) {
        finalData.razorpayKeySecret = encrypt(finalData.razorpayKeySecret);
      }
    }
    
    if (domain === 'smtp') {
      if (finalData.password) {
        finalData.password = encrypt(finalData.password);
      }
    }

    await prisma.systemSettings.upsert({
      where: { key: domain },
      update: { value: finalData },
      create: { key: domain, value: finalData }
    });

    return await this.getSettingsByKeys([domain]);
  }
}

export default new SettingsService();
