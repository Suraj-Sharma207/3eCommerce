import userRepository from '../repositories/userRepository.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { generateToken } from '../utils/jwt.js';

class AuthService {
  async register(data) {
    const { name, email, password } = data;
    
    // Check if user exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await userRepository.create({
      name,
      email,
      password: hashedPassword,
    });

    // Generate token
    const token = generateToken({ id: user.id, role: user.role });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    };
  }

  async login(data) {
    const { email, password } = data;
    
    // Check if user exists
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = generateToken({ id: user.id, role: user.role });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    };
  }

  async getMe(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
  }
}

export default new AuthService();
