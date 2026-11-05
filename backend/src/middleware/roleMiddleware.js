import { errorResponse } from "../utils/response.js";

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, "Not authorized to access this route", [], 403);
    }
    const allowedRoles = [...roles];
    if (allowedRoles.includes("ADMIN")) {
      allowedRoles.push("SUPER_ADMIN");
    }
    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, "Not authorized to access this route", [], 403);
    }
    next();
  };
};
