import { errorResponse } from '../utils/response.js';

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return errorResponse(res, 'Not authorized to access this route', [], 403);
    }
    next();
  };
};
