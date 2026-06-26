import userRepository from '../repositories/userRepository.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { generateToken } from '../utils/jwt.js';
import crypto from 'crypto';
import emailEvents from '../email/utils/emailEvents.js';
import prisma from '../lib/prisma.js';

class AuthService {
  async register(data) {
    const { name, email, password, phone } = data;
    
    // Check if user exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate verification token (24 hours expiry)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create user
    const user = await userRepository.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      verificationToken,
      verificationExpires,
      isEmailVerified: false
    });

    // Emit event listeners asynchronously
    emailEvents.emit('user.registered', user);
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    emailEvents.emit('user.verification_requested', { user, verificationUrl });

    // Generate token
    const token = generateToken({ id: user.id, role: user.role, tokenVersion: user.tokenVersion });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        avatarPublicId: user.avatarPublicId,
        phone: user.phone,
        gender: user.gender,
        birthday: user.birthday,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      token
    };
  }

  async login(data) {
    const { email, password } = data;
    
    // Check if user exists
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    // Check password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    // Generate token
    const token = generateToken({ id: user.id, role: user.role, tokenVersion: user.tokenVersion });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        avatarPublicId: user.avatarPublicId,
        phone: user.phone,
        gender: user.gender,
        birthday: user.birthday,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      token
    };
  }

  async getMe(userId) {
    const user = await userRepository.findProfileById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      throw new Error('Invalid current password');
    }

    const hashedPassword = await hashPassword(newPassword);
    await userRepository.update(userId, { 
      password: hashedPassword,
      passwordUpdatedAt: new Date(),
      tokenVersion: { increment: 1 }
    });
    
    return { success: true };
  }

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    // Security best practice: Don't reveal if email exists, but return success
    if (!user) {
      return { success: true };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await userRepository.update(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    emailEvents.emit('user.password_reset_requested', { user, resetUrl });

    return { success: true };
  }

  async resetPassword(token, newPassword) {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired password reset token');
    }

    const hashedPassword = await hashPassword(newPassword);

    await userRepository.update(user.id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      passwordUpdatedAt: new Date(),
      tokenVersion: { increment: 1 }
    });

    return { success: true };
  }

  async verifyEmail(token) {
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationExpires: { gt: new Date() }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired email verification token');
    }

    await userRepository.update(user.id, {
      isEmailVerified: true,
      verificationToken: null,
      verificationExpires: null
    });

    return { success: true };
  }
}

export default new AuthService();
