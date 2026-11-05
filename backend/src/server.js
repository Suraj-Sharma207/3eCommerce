import dotenv from "dotenv";
dotenv.config();

// SECURITY: Import env validation first — this will fail-fast if required
// secrets are missing, before any other module loads.
import { env } from "./config/env.js";
import app from "./app.js";
import prisma from "./lib/prisma.js";
import { initializeTemplates } from "./email/utils/templateCompiler.js";
import { initRedis, closeRedis } from "./services/cacheService.js";

const startServer = async () => {
  try {
    // Check database connection
    await prisma.$connect();
    console.log("Connected to PostgreSQL Database");

    // Initialize Redis cache connection with memory fallback
    await initRedis();

    // Pre-compile and cache all email templates at startup
    initializeTemplates();

    const server = app.listen(env.port, () => {
      console.log(`Server is running on port ${env.port}`);
    });

    // Handle graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);

      // Force exit after 1.5 seconds if cleanup hangs (e.g. due to keep-alive TCP connections)
      setTimeout(() => {
        console.warn("[Server] Graceful shutdown timed out. Force exiting...");
        process.exit(1);
      }, 1500);

      server.close(async () => {
        console.log("HTTP server closed.");
        try {
          await prisma.$disconnect();
          console.log("Database connection closed.");
        } catch (err) {
          console.error("Error disconnecting database:", err.message);
        }
        try {
          await closeRedis();
        } catch (err) {}
        process.exit(0);
      });
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGUSR2", () => gracefulShutdown("SIGUSR2")); // For nodemon restarts
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    await prisma.$disconnect();
    await closeRedis();
    process.exit(1);
  }
};

// Phase 13: Global error handlers for unexpected crashes.
// These ensure the process exits with a non-zero code and logs the error
// instead of silently hanging or producing undefined behavior.
process.on("uncaughtException", (error) => {
  console.error("[FATAL] Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[FATAL] Unhandled Promise Rejection:", reason);
  process.exit(1);
});

startServer();
