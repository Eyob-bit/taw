import app from './app.js';
import { config } from './config/index.js';
import prisma from './services/prisma.js';

const server = app.listen(config.port, () => {
  console.log(`🚀 Relationship Awareness API running on port ${config.port} [${config.env}]`);
  console.log(`📡 Health Check: http://localhost:${config.port}/health`);
});

// Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
