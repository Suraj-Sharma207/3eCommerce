import { verifyToken } from "../utils/jwt.js";
import { errorResponse } from "../utils/response.js";
import prisma from "../lib/prisma.js";
import { getAuthCookieNames } from "../utils/cookieConfig.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    const cookieNames = getAuthCookieNames(req);
    if (req.cookies && req.cookies[cookieNames.access]) {
      token = req.cookies[cookieNames.access];
    }

    if (!token) {
      return errorResponse(res, "Not authorized, no token provided", [], 401);
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return errorResponse(res, "Not authorized, token failed", [], 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tokenVersion: true,
      },
    });

    if (!user) {
      return errorResponse(res, "User no longer exists", [], 401);
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      return errorResponse(
        res,
        "Session expired or invalidated. Please login again.",
        [],
        401,
      );
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, "Not authorized, token failed", [], 401);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    const cookieNames = getAuthCookieNames(req);

    if (req.cookies && req.cookies[cookieNames.access]) {
      token = req.cookies[cookieNames.access];
    }

    if (!token) {
      return next(); // Proceed as guest
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(); // Token invalid, proceed as guest
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tokenVersion: true,
      },
    });

    if (user && decoded.tokenVersion === user.tokenVersion) {
      req.user = user;
    }

    next();
  } catch (error) {
    next(); // On any error, just proceed as guest
  }
};
