import prisma from "../lib/prisma.js";
import { encrypt, decrypt } from "../utils/crypto.js";

class SettingsService {
  async getSettingsByKeys(keys) {
    const settings = await prisma.systemSettings.findMany({
      where: { key: { in: keys } },
    });

    const settingsObject = {};
    keys.forEach((k) => {
      settingsObject[k] = {}; // Default empty object
    });

    settings.forEach((s) => {
      // Decrypt sensitive fields if this is a payment setting
      if (s.key === "payment" && s.value) {
        if (s.value.stripeSecretKey) {
          s.value.stripeSecretKey = decrypt(s.value.stripeSecretKey);
        }
        if (s.value.razorpayKeySecret) {
          s.value.razorpayKeySecret = decrypt(s.value.razorpayKeySecret);
        }
      }
      if (s.key === "smtp" && s.value && s.value.password) {
        s.value.password = decrypt(s.value.password);
      }

      settingsObject[s.key] = s.value;
    });

    return settingsObject;
  }

  async updateSettings(domain, data) {
    let finalData = { ...data };

    // Fetch existing raw record from DB to preserve encrypted values
    const existingRecord = await prisma.systemSettings.findUnique({
      where: { key: domain },
    });
    const existingRawValue = existingRecord ? existingRecord.value : {};

    // Encrypt sensitive fields only if they are new (plain text)
    if (domain === "payment") {
      if (
        finalData.stripeSecretKey &&
        finalData.stripeSecretKey !== existingRawValue.stripeSecretKey
      ) {
        finalData.stripeSecretKey = encrypt(finalData.stripeSecretKey);
      } else if (
        !finalData.stripeSecretKey &&
        existingRawValue.stripeSecretKey
      ) {
        finalData.stripeSecretKey = existingRawValue.stripeSecretKey;
      }

      if (
        finalData.razorpayKeySecret &&
        finalData.razorpayKeySecret !== existingRawValue.razorpayKeySecret
      ) {
        finalData.razorpayKeySecret = encrypt(finalData.razorpayKeySecret);
      } else if (
        !finalData.razorpayKeySecret &&
        existingRawValue.razorpayKeySecret
      ) {
        finalData.razorpayKeySecret = existingRawValue.razorpayKeySecret;
      }
    }

    if (domain === "smtp") {
      if (
        finalData.password &&
        finalData.password !== existingRawValue.password
      ) {
        // Assume it's a plain text new password
        finalData.password = encrypt(finalData.password);
      } else if (!finalData.password && existingRawValue.password) {
        // Keep original encrypted password
        finalData.password = existingRawValue.password;
      }
    }

    await prisma.systemSettings.upsert({
      where: { key: domain },
      update: { value: finalData },
      create: { key: domain, value: finalData },
    });

    return await this.getSettingsByKeys([domain]);
  }
}

export default new SettingsService();
