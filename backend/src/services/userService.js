import userRepository from "../repositories/userRepository.js";
import { hashPassword, comparePassword } from "../utils/bcrypt.js";
import cloudinary from "../config/cloudinary.js";

class UserService {
  async getProfile(userId) {
    const user = await userRepository.findProfileById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async getStats(userId) {
    return await userRepository.getProfileStats(userId);
  }

  async updateProfile(userId, updateData) {
    // Only allow updating certain fields (Avatar is handled separately)
    const allowedFields = [
      "name",
      "phone",
      "birthday",
      "gender",
      "language",
      "currency",
      "newsletter",
    ];
    const dataToUpdate = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        dataToUpdate[field] = updateData[field];
      }
    }

    if (dataToUpdate.birthday) {
      dataToUpdate.birthday = new Date(dataToUpdate.birthday);
    }

    const updatedUser = await userRepository.update(userId, dataToUpdate);

    // M-1 FIX: Invalidate user session status cache on profile update
    try {
      const { cacheInvalidateByPattern } = await import("./cacheService.js");
      await cacheInvalidateByPattern(`user:session:${userId}:*`);
    } catch (err) {
      console.error(
        "Failed to invalidate user session cache on profile update:",
        err,
      );
    }

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async uploadAvatar(userId, file) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const newAvatarUrl = file.path; // Cloudinary secure_url
    const newAvatarPublicId = file.filename; // Cloudinary public_id

    // If there is an existing avatar in Cloudinary, delete it
    if (user.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      } catch (err) {
        console.error("Failed to delete old avatar from Cloudinary:", err);
      }
    }

    const updatedUser = await userRepository.update(userId, {
      avatarUrl: newAvatarUrl,
      avatarPublicId: newAvatarPublicId,
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      const error = new Error("Incorrect current password");
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await hashPassword(newPassword);
    // H-1 + M-6 FIX: Increment tokenVersion to invalidate all JWTs and set passwordUpdatedAt
    await userRepository.update(userId, {
      password: hashedPassword,
      passwordUpdatedAt: new Date(),
      tokenVersion: { increment: 1 },
    });

    // H-1 FIX: Delete all active sessions for this user
    const { default: prisma } = await import("../lib/prisma.js");
    await prisma.session.deleteMany({ where: { userId } });

    return true;
  }
}

export default new UserService();
