import app from './app.js';
import { config } from './config/index.js';
import prisma from './services/prisma.js';

let botInstance = null;

const server = app.listen(config.port, async () => {
  console.log(`🚀 Relationship Awareness API running on port ${config.port} [${config.env}]`);
  console.log(`📡 Health Check: http://localhost:${config.port}/health`);

  // Optionally launch embedded Telegram Bot if configured to run inside API service (saves extra worker cost)
  if (config.embeddedBot) {
    if (config.bot.token && !config.bot.token.includes('SAMPLE_TOKEN')) {
      try {
        console.log('🤖 Starting embedded Telegram Bot inside API service...');
        const { createBot } = await import('../../bot/src/index.js');
        botInstance = createBot(config.bot.token);
        botInstance.launch(
          { dropPendingUpdates: true },
          () => console.log('🤖 Embedded Telegram Bot started successfully and listening for messages')
        ).catch((err) => console.error('Failed to launch embedded bot:', err.message));
      } catch (err) {
        console.error('Failed to load embedded Telegram bot:', err.message);
      }
    } else {
      console.log('ℹ️ RUN_EMBEDDED_BOT is enabled, but TELEGRAM_BOT_TOKEN is not configured or is a placeholder.');
    }
  }
});

// Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  if (botInstance) {
    try {
      botInstance.stop(signal);
    } catch {}
  }
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
