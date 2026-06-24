import app from './app.js';
import { config } from './config/index.js';
import prisma from './lib/prisma.js';

const startServer = async () => {
  try {
    // Check database connection
    await prisma.$connect();
    console.log('📦 Connected to PostgreSQL Database');

    app.listen(config.port, () => {
      console.log(`🚀 Server is running on port ${config.port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});
