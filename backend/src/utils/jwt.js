import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const generateToken = (payload, options = {}) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: options.expiresIn || process.env.JWT_EXPIRES_IN || '1d',
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret');
  } catch (error) {
    return null;
  }
};
