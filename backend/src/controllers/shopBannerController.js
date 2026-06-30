import prisma from '../lib/prisma.js';
import cloudinary from '../config/cloudinary.js';

export const getActiveShopBanner = async (req, res, next) => {
  try {
    const banner = await prisma.shopBanner.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: banner
    });
  } catch (error) {
    next(error);
  }
};

export const createShopBanner = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No banner image file provided' });
    }

    // Convert buffer to base64 string
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'shop-banners',
      resource_type: 'image',
    });

    // Deactivate any previously active banners first
    await prisma.shopBanner.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    const newBanner = await prisma.shopBanner.create({
      data: {
        image: result.secure_url,
        imagePublicId: result.public_id,
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Shop banner uploaded and activated successfully',
      data: newBanner
    });
  } catch (error) {
    console.error('Shop banner upload error:', error);
    next(error);
  }
};

export const updateShopBanner = async (req, res, next) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const banner = await prisma.shopBanner.findUnique({
      where: { id }
    });

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Shop banner not found' });
    }

    let updatedData = {};

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'shop-banners',
        resource_type: 'image',
      });

      updatedData.image = result.secure_url;
      updatedData.imagePublicId = result.public_id;

      if (banner.imagePublicId) {
        try {
          await cloudinary.uploader.destroy(banner.imagePublicId);
        } catch (cloudinaryError) {
          console.error('Failed to delete old Cloudinary image:', cloudinaryError);
        }
      }
    }

    if (isActive !== undefined) {
      const activeBool = isActive === 'true' || isActive === true;
      updatedData.isActive = activeBool;

      if (activeBool) {
        await prisma.shopBanner.updateMany({
          where: { 
            id: { not: id },
            isActive: true 
          },
          data: { isActive: false }
        });
      }
    }

    const updatedBanner = await prisma.shopBanner.update({
      where: { id },
      data: updatedData
    });

    res.status(200).json({
      success: true,
      message: 'Shop banner updated successfully',
      data: updatedBanner
    });
  } catch (error) {
    next(error);
  }
};

export const deleteShopBanner = async (req, res, next) => {
  const { id } = req.params;

  try {
    const banner = await prisma.shopBanner.findUnique({
      where: { id }
    });

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Shop banner not found' });
    }

    if (banner.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(banner.imagePublicId);
      } catch (cloudinaryError) {
        console.error('Failed to delete Cloudinary image:', cloudinaryError);
      }
    }

    await prisma.shopBanner.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Shop banner deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getAllShopBanners = async (req, res, next) => {
  try {
    const banners = await prisma.shopBanner.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({
      success: true,
      data: banners
    });
  } catch (error) {
    next(error);
  }
};
