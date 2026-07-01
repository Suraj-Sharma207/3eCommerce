import dotenv from 'dotenv';
import app from './app.js';
import { config } from './config/index.js';
import prisma from './lib/prisma.js';
import { initializeTemplates } from './email/utils/templateCompiler.js';

const startServer = async () => {
  try {
    // Check database connection
    await prisma.$connect();
    console.log('📦 Connected to PostgreSQL Database');

    // Pre-compile and cache all email templates at startup
    initializeTemplates();

    const server = app.listen(config.port, () => {
      console.log(`🚀 Server is running on port ${config.port}`);
    });

    // Handle graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        await prisma.$disconnect();
        console.log('Database connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon restarts

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
