import { errorResponse } from '../utils/response.js';
import { Prisma } from '@prisma/client';

export const errorHandler = (err, req, res, next) => {
  // Check if it is an official Prisma database error
  const isPrismaError = 
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientValidationError ||
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientRustPanicError;

  const timestamp = new Date().toISOString();
  const route = `${req.method} ${req.originalUrl}`;
  const userId = req.user ? req.user.id : 'Anonymous';
  const ipAddress = req.ip || req.connection.remoteAddress;
  const requestId = req.id || 'N/A';

  // Log complete diagnostic information on the server
  console.error(`\n=== DIAGNOSTIC EXCEPTION LOG ===`);
  console.error(`Timestamp : ${timestamp}`);
  console.error(`Route     : ${route}`);
  console.error(`User ID   : ${userId}`);
  console.error(`IP Address: ${ipAddress}`);
  console.error(`Request ID: ${requestId}`);

  if (isPrismaError) {
    console.error(`Error Type: Prisma Database Error (${err.constructor.name})`);
    console.error(`Error Code: ${err.code || 'N/A'}`);
    console.error(err.stack || err);
    console.error(`=================================\n`);

    // Never expose Prisma or database internals to the client
    return res.status(500).json({
      success: false,
      message: 'Unable to complete your request. Please try again later.'
    });
  }

  // Handle regular application exceptions
  console.error(`Error Type: Application Exception`);
  console.error(err.stack || err);
  console.error(`=================================\n`);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Backup check to prevent any raw string leak containing ORM/Prisma names
  if (message.toLowerCase().includes('prisma') || message.toLowerCase().includes('database')) {
    return res.status(500).json({
      success: false,
      message: 'Unable to complete your request. Please try again later.'
    });
  }

  return errorResponse(res, message, [], statusCode);
};

export const notFoundHandler = (req, res, next) => {
  return errorResponse(res, 'Route not found', [], 404);
};
