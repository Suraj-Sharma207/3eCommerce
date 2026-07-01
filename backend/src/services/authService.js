import userRepository from '../repositories/userRepository.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { generateToken, verifyToken } from '../utils/jwt.js';
import { getFrontendUrl } from '../utils/urlUtils.js';
import crypto from 'crypto';
import emailEvents from '../email/utils/emailEvents.js';
import prisma from '../lib/prisma.js';
import securitySettingsService from './securitySettingsService.js';
import ms from 'ms';
import { UAParser } from 'ua-parser-js';

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
    const verificationUrl = `${getFrontendUrl()}/verify-email?token=${verificationToken}`;
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

  async login(data, reqInfo = {}) {
    const { email, password } = data;
    
    // Check if user exists
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const settings = await securitySettingsService.getSettings();

    // Check account lockout
    if (settings.accountLockoutEnabled && user.lockoutUntil && user.lockoutUntil > new Date()) {
      throw new Error(`Account locked until ${user.lockoutUntil.toLocaleTimeString()}. Please try again later.`);
    }

    // Check password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      if (settings.accountLockoutEnabled) {
        const attempts = user.failedLoginAttempts + 1;
        const updates = { failedLoginAttempts: attempts };
        if (attempts >= settings.failedLoginLimit) {
          updates.lockoutUntil = new Date(Date.now() + ms(settings.lockDuration));
        }
        await userRepository.update(user.id, updates);
      }
      
      await prisma.securityLog.create({
        data: { userId: user.id, action: 'LOGIN_FAILED', ipAddress: reqInfo.ip, details: { reason: 'Invalid password' } }
      });
      
      throw new Error('Invalid email or password.');
    }

    // Reset lockout if successful
    if (user.failedLoginAttempts > 0) {
      await userRepository.update(user.id, { failedLoginAttempts: 0, lockoutUntil: null });
    }

    // Parse User Agent
    let browserName = 'Unknown', osName = 'Unknown', deviceType = 'Desktop';
    if (reqInfo.userAgent) {
      const parser = new UAParser(reqInfo.userAgent);
      browserName = parser.getBrowser().name || 'Unknown';
      osName = parser.getOS().name || 'Unknown';
      deviceType = parser.getDevice().type || 'Desktop';
    }

    // Generate tokens
    const accessMaxAge = ms(settings.jwtExpiry);
    const refreshMaxAge = ms(settings.refreshTokenExpiry);
    
    // Use JWT options to set dynamic expiry
    const accessToken = generateToken(
      { id: user.id, role: user.role, tokenVersion: user.tokenVersion },
      { expiresIn: settings.jwtExpiry }
    );
    
    const refreshTokenPlain = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenPlain).digest('hex');
    
    // Create Session
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        device: deviceType,
        browser: browserName,
        operatingSystem: osName,
        ipAddress: reqInfo.ip || null,
        expiresAt: new Date(Date.now() + refreshMaxAge)
      }
    });

    // Log event
    await prisma.securityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        ipAddress: reqInfo.ip,
        browser: browserName,
        device: deviceType
      }
    });

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
      accessToken,
      refreshToken: refreshTokenPlain,
      cookiesConfig: { accessMaxAge, refreshMaxAge }
    };
  }

  async logout(refreshTokenPlain) {
    if (refreshTokenPlain) {
      const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenPlain).digest('hex');
      const session = await prisma.session.findFirst({ where: { refreshTokenHash } });
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
        await prisma.securityLog.create({
          data: { userId: session.userId, action: 'LOGOUT', ipAddress: session.ipAddress }
        });
      }
    }
    return { success: true };
  }

  async refresh(refreshTokenPlain, reqInfo = {}) {
    const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenPlain).digest('hex');
    const session = await prisma.session.findFirst({
      where: { refreshTokenHash, isActive: true },
      include: { user: true }
    });

    if (!session) {
      throw new Error('Invalid refresh token');
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      throw new Error('Refresh token expired');
    }

    const settings = await securitySettingsService.getSettings();
    const accessMaxAge = ms(settings.jwtExpiry);
    const refreshMaxAge = ms(settings.refreshTokenExpiry);

    // Rotate Refresh Token
    const newRefreshTokenPlain = crypto.randomBytes(64).toString('hex');
    const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshTokenPlain).digest('hex');

    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + refreshMaxAge)
      }
    });

    const accessToken = generateToken(
      { id: session.user.id, role: session.user.role, tokenVersion: session.user.tokenVersion },
      { expiresIn: settings.jwtExpiry }
    );

    await prisma.securityLog.create({
      data: { userId: session.user.id, action: 'TOKEN_REFRESHED', ipAddress: reqInfo.ip }
    });

    return {
      accessToken,
      newRefreshToken: newRefreshTokenPlain,
      cookiesConfig: { accessMaxAge, refreshMaxAge }
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

    const resetUrl = `${getFrontendUrl()}/reset-password?token=${resetToken}`;
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
