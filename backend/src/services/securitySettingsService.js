import prisma from "../lib/prisma.js";

class SecuritySettingsService {
  async getSettings() {
    let settings = await prisma.systemSettings.findUnique({
      where: { key: "SECURITY_SETTINGS" },
    });

    const defaultSettings = {
      sessionTimeout: "24h",
      jwtExpiry: "15m",
      refreshTokenExpiry: "30d",
      accountLockoutEnabled: true,
      failedLoginLimit: 5,
      lockDuration: "15m",
      rememberMeExpiry: "30d",
    };

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          key: "SECURITY_SETTINGS",
          value: defaultSettings,
        },
      });
    }

    return settings.value;
  }

  async updateSettings(newSettings) {
    // M-8 FIX: Validate input before merging
    const allowedKeys = [
      "sessionTimeout",
      "jwtExpiry",
      "refreshTokenExpiry",
      "idleTimeout",
      "accountLockoutEnabled",
      "failedLoginLimit",
      "lockDuration",
      "rememberMeExpiry",
      "requireEmailVerification",
    ];

    const validated = {};
    for (const [key, value] of Object.entries(newSettings)) {
      if (!allowedKeys.includes(key)) continue; // reject unknown keys

      if (
        [
          "sessionTimeout",
          "jwtExpiry",
          "refreshTokenExpiry",
          "lockDuration",
          "rememberMeExpiry",
          "idleTimeout",
        ].includes(key)
      ) {
        if (typeof value !== "string" || !/^\d+[smhd]$/.test(value)) {
          throw new Error(
            `Invalid value for ${key}: must be a duration string like '15m', '24h', '30d'`,
          );
        }
        validated[key] = value;
      } else if (key === "failedLoginLimit") {
        const num = parseInt(value, 10);
        if (!Number.isFinite(num) || num < 1 || num > 50) {
          throw new Error(
            `Invalid value for failedLoginLimit: must be a number between 1 and 50`,
          );
        }
        validated[key] = num;
      } else if (
        ["accountLockoutEnabled", "requireEmailVerification"].includes(key)
      ) {
        if (typeof value !== "boolean") {
          throw new Error(`Invalid value for ${key}: must be a boolean`);
        }
        validated[key] = value;
      }
    }

    const currentSettings = await this.getSettings();
    const updatedValue = { ...currentSettings, ...validated };

    const settings = await prisma.systemSettings.update({
      where: { key: "SECURITY_SETTINGS" },
      data: { value: updatedValue },
    });

    return settings.value;
  }
}

export default new SecuritySettingsService();
