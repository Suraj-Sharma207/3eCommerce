/**
 * JWT Utility
 *
 * SECURITY: JWT_SECRET is sourced from validated environment config.
 * No insecure fallbacks. The application will not start without a
 * properly configured JWT_SECRET (minimum 64 characters).
 */
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const generateToken = (payload, options = {}) => {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: options.expiresIn || env.jwtExpiresIn,
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch (error) {
    return null;
  }
};
