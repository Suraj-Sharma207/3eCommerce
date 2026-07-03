import { brandingService } from '../services/brandingService.js';
import cloudinary from '../config/cloudinary.js';
import { cacheGet, cacheSet, cacheDel } from '../services/cacheService.js';

const BRANDING_CACHE_KEY = 'branding:all';

export const getBranding = async (req, res, next) => {
  try {
    const cached = await cacheGet(BRANDING_CACHE_KEY);
    if (cached) {
      res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
      return res.status(200).json({
        success: true,
        data: cached
      });
    }

    const branding = await brandingService.getBranding();
    await cacheSet(BRANDING_CACHE_KEY, branding, 3600); // 1 hour TTL
    res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
    res.status(200).json({
      success: true,
      data: branding
    });
  } catch (error) {
    next(error);
  }
};

export const updateBranding = async (req, res, next) => {
  try {
    const branding = await brandingService.updateBranding(req.body);
    await cacheDel(BRANDING_CACHE_KEY);
    res.status(200).json({
      success: true,
      message: 'Branding updated successfully',
      data: branding
    });
  } catch (error) {
    next(error);
  }
};

export const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No logo file provided' });
    }

    // Convert buffer to base64 string
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'luxehome/branding',
      resource_type: 'image',
    });

    const branding = await brandingService.updateLogo(result.secure_url, result.public_id);
    await cacheDel(BRANDING_CACHE_KEY);

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      data: branding
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to upload logo. Cloudinary is temporarily unavailable. Please try again.'
    });
  }
};

export const uploadEmailLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No email logo file provided' });
    }

    // Convert buffer to base64 string
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'luxehome/email-branding',
      resource_type: 'image',
    });

    const branding = await brandingService.updateEmailLogo(result.secure_url, result.public_id);
    await cacheDel(BRANDING_CACHE_KEY);

    res.status(200).json({
      success: true,
      message: 'Email Logo uploaded successfully',
      data: branding
    });
  } catch (error) {
    console.error('Email Logo upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to upload email logo. Cloudinary is temporarily unavailable. Please try again.'
    });
  }
};
