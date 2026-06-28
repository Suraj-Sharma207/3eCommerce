import { PrismaClient } from '@prisma/client';
import cloudinary from '../config/cloudinary.js';

const prisma = new PrismaClient();

class BrandingService {
  constructor() {
    this.cachedBranding = null;
    this.lastFetched = null;
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get branding settings, caching them in-memory to reduce DB calls.
   */
  async getBranding() {
    const now = Date.now();
    if (this.cachedBranding && this.lastFetched && (now - this.lastFetched < this.cacheTTL)) {
      return this.cachedBranding;
    }

    let branding = await prisma.brandingSettings.findFirst();

    if (!branding) {
      branding = await prisma.brandingSettings.create({
        data: {
          platformName: 'LuxeHome'
        }
      });
    }

    this.cachedBranding = branding;
    this.lastFetched = now;

    return this.cachedBranding;
  }

  /**
   * Update the platform name and other text fields.
   */
  async updateBranding(data) {
    let branding = await prisma.brandingSettings.findFirst();

    if (!branding) {
      branding = await prisma.brandingSettings.create({
        data: {
          platformName: data.platformName || 'LuxeHome'
        }
      });
    } else {
      branding = await prisma.brandingSettings.update({
        where: { id: branding.id },
        data: {
          platformName: data.platformName
        }
      });
    }

    // Invalidate cache
    this.cachedBranding = branding;
    this.lastFetched = Date.now();

    return this.cachedBranding;
  }

  /**
   * Update the logo details.
   */
  async updateLogo(logoUrl, logoPublicId) {
    let branding = await prisma.brandingSettings.findFirst();

    // If there is an existing logo, delete it from Cloudinary
    if (branding && branding.logoPublicId && branding.logoPublicId !== logoPublicId) {
      try {
        await cloudinary.uploader.destroy(branding.logoPublicId);
      } catch (error) {
        console.error('Failed to delete old Cloudinary logo:', error);
      }
    }

    if (!branding) {
      branding = await prisma.brandingSettings.create({
        data: {
          platformName: 'LuxeHome',
          logoUrl,
          logoPublicId
        }
      });
    } else {
      branding = await prisma.brandingSettings.update({
        where: { id: branding.id },
        data: {
          logoUrl,
          logoPublicId
        }
      });
    }

    // Invalidate cache
    this.cachedBranding = branding;
    this.lastFetched = Date.now();

    return this.cachedBranding;
  }
}

export const brandingService = new BrandingService();
