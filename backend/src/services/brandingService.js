import prisma from "../lib/prisma.js";
import cloudinary from "../config/cloudinary.js";

class BrandingService {
  constructor() {
    this.cachedBranding = null;
    this.lastFetched = null;
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Helper to strictly enforce database singleton.
   * Cleans duplicate records if any exist.
   */
  async getOrCreateBranding() {
    let brandingRecords = await prisma.brandingSettings.findMany({
      orderBy: { createdAt: "asc" },
    });

    let branding;
    if (brandingRecords.length === 0) {
      branding = await prisma.brandingSettings.create({
        data: {
          platformName: "LuxeHome",
        },
      });
    } else {
      branding = brandingRecords[0];
      if (brandingRecords.length > 1) {
        // Delete all extra branding records to enforce singleton
        const idsToDelete = brandingRecords.slice(1).map((r) => r.id);
        await prisma.brandingSettings.deleteMany({
          where: { id: { in: idsToDelete } },
        });
      }
    }
    return branding;
  }

  /**
   * Get branding settings, caching them in-memory to reduce DB calls.
   */
  async getBranding() {
    const now = Date.now();
    if (
      this.cachedBranding &&
      this.lastFetched &&
      now - this.lastFetched < this.cacheTTL
    ) {
      return this.cachedBranding;
    }

    const branding = await this.getOrCreateBranding();

    this.cachedBranding = branding;
    this.lastFetched = now;

    return this.cachedBranding;
  }

  /**
   * Update the platform name and other text fields.
   */
  async updateBranding(data) {
    let branding = await this.getOrCreateBranding();

    const updated = await prisma.brandingSettings.update({
      where: { id: branding.id },
      data: {
        platformName: data.platformName,
        brandingVersion: { increment: 1 },
      },
    });

    // Invalidate cache immediately to ensure fresh fetch
    this.cachedBranding = null;
    this.lastFetched = null;

    return updated;
  }

  /**
   * Update the logo details.
   */
  async updateLogo(logoUrl, logoPublicId) {
    let branding = await this.getOrCreateBranding();

    // If there is an existing logo, delete it from Cloudinary
    if (branding.logoPublicId && branding.logoPublicId !== logoPublicId) {
      try {
        await cloudinary.uploader.destroy(branding.logoPublicId);
      } catch (error) {
        console.error("Failed to delete old Cloudinary logo:", error);
      }
    }

    const updated = await prisma.brandingSettings.update({
      where: { id: branding.id },
      data: {
        logoUrl,
        logoPublicId,
        brandingVersion: { increment: 1 },
      },
    });

    // Invalidate cache immediately
    this.cachedBranding = null;
    this.lastFetched = null;

    return updated;
  }

  /**
   * Update the email logo details.
   */
  async updateEmailLogo(emailLogoUrl, emailLogoPublicId) {
    let branding = await this.getOrCreateBranding();

    // If there is an existing logo, delete it from Cloudinary
    if (
      branding.emailLogoPublicId &&
      branding.emailLogoPublicId !== emailLogoPublicId
    ) {
      try {
        await cloudinary.uploader.destroy(branding.emailLogoPublicId);
      } catch (error) {
        console.error("Failed to delete old Cloudinary email logo:", error);
      }
    }

    const updated = await prisma.brandingSettings.update({
      where: { id: branding.id },
      data: {
        emailLogoUrl,
        emailLogoPublicId,
        brandingVersion: { increment: 1 },
      },
    });

    // Invalidate cache immediately
    this.cachedBranding = null;
    this.lastFetched = null;

    return updated;
  }
}

export const brandingService = new BrandingService();
