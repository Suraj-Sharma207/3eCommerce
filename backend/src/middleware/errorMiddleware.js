import { errorResponse } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  return errorResponse(res, message, [], statusCode);
};

export const notFoundHandler = (req, res, next) => {
  return errorResponse(res, 'Route not found', [], 404);
};
