import dotenv from 'dotenv';
import app from './app.js';
import { config } from './config/index.js';
import prisma from './lib/prisma.js';
import { initializeTemplates } from './email/utils/templateCompiler.js';
import { initRedis, closeRedis } from './services/cacheService.js';

const startServer = async () => {
  try {
    // Check database connection
    await prisma.$connect();
    console.log('📦 Connected to PostgreSQL Database');

    // Initialize Redis cache connection with memory fallback
    await initRedis();

    // Pre-compile and cache all email templates at startup
    initializeTemplates();

    const server = app.listen(config.port, () => {
      console.log(`🚀 Server is running on port ${config.port}`);
    });

    // Handle graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      
      // Force exit after 1.5 seconds if cleanup hangs (e.g. due to keep-alive TCP connections)
      setTimeout(() => {
        console.warn('[Server] Graceful shutdown timed out. Force exiting...');
        process.exit(0);
      }, 1500);

      server.close(async () => {
        console.log('HTTP server closed.');
        try {
          await prisma.$disconnect();
          console.log('Database connection closed.');
        } catch (err) {
          console.error('Error disconnecting database:', err.message);
        }
        try {
          await closeRedis();
        } catch (err) {}
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon restarts

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    await closeRedis();
    process.exit(1);
  }
};

startServer();
