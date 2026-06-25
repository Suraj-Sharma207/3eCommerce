import userRepository from '../repositories/userRepository.js';

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
}

export default new UserService();
