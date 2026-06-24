import { verifyToken } from '../utils/jwt.js';
import { errorResponse } from '../utils/response.js';
import prisma from '../lib/prisma.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return errorResponse(res, 'Not authorized, no token provided', [], 401);
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return errorResponse(res, 'Not authorized, token failed', [], 401);
    }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true }
    });
    
    if (!user) {
      return errorResponse(res, 'User no longer exists', [], 401);
    }
    
    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 'Not authorized, token failed', [], 401);
  }
};
