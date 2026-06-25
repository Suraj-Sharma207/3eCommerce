import userRepository from '../repositories/userRepository.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';

class UserService {
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    const stats = await userRepository.getProfileStats(userId);
    const { password, ...userWithoutPassword } = user;
    userWithoutPassword.stats = stats;
    return userWithoutPassword;
  }

  async updateProfile(userId, updateData) {
    // Only allow updating certain fields
    const allowedFields = ['name', 'phone', 'birthday', 'gender', 'avatarUrl', 'language', 'currency', 'newsletter'];
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
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      const error = new Error('Incorrect current password');
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await hashPassword(newPassword);
    await userRepository.update(userId, { password: hashedPassword });
    return true;
  }
}

export default new UserService();
