import prisma from "../lib/prisma.js";
import cloudinary from "../config/cloudinary.js";

export const getActiveBanner = async (req, res, next) => {
  try {
    const banner = await prisma.saleBanner.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    res.status(200).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No banner image file provided" });
    }

    // Convert buffer to base64 string
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "sale-banners",
      resource_type: "image",
    });

    // Deactivate any previously active banners first
    await prisma.saleBanner.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const newBanner = await prisma.saleBanner.create({
      data: {
        image: result.secure_url,
        imagePublicId: result.public_id,
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Banner uploaded and activated successfully",
      data: newBanner,
    });
  } catch (error) {
    console.error("Banner upload error:", error);
    next(error);
  }
};

export const updateBanner = async (req, res, next) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const banner = await prisma.saleBanner.findUnique({
      where: { id },
    });

    if (!banner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    let updatedData = {};

    // If a new image file is provided
    if (req.file) {
      // Upload new image to Cloudinary
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "sale-banners",
        resource_type: "image",
      });

      updatedData.image = result.secure_url;
      updatedData.imagePublicId = result.public_id;

      // Delete old image from Cloudinary
      if (banner.imagePublicId) {
        try {
          await cloudinary.uploader.destroy(banner.imagePublicId);
        } catch (cloudinaryError) {
          console.error(
            "Failed to delete old Cloudinary image:",
            cloudinaryError,
          );
        }
      }
    }

    if (isActive !== undefined) {
      const activeBool = isActive === "true" || isActive === true;
      updatedData.isActive = activeBool;

      if (activeBool) {
        // Deactivate all other banners
        await prisma.saleBanner.updateMany({
          where: {
            id: { not: id },
            isActive: true,
          },
          data: { isActive: false },
        });
      }
    }

    const updatedBanner = await prisma.saleBanner.update({
      where: { id },
      data: updatedData,
    });

    res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      data: updatedBanner,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (req, res, next) => {
  const { id } = req.params;

  try {
    const banner = await prisma.saleBanner.findUnique({
      where: { id },
    });

    if (!banner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    // Delete image from Cloudinary
    if (banner.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(banner.imagePublicId);
      } catch (cloudinaryError) {
        console.error(
          "Failed to delete Cloudinary image during banner deletion:",
          cloudinaryError,
        );
      }
    }

    await prisma.saleBanner.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getAllBanners = async (req, res, next) => {
  try {
    const banners = await prisma.saleBanner.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({
      success: true,
      data: banners,
    });
  } catch (error) {
    next(error);
  }
};
