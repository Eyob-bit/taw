import app from './app.js';
import { config } from './config/index.js';
import prisma from './services/prisma.js';
import { startKeepAlive } from './jobs/keepAlive.js';

let botInstance = null;

/**
 * Launch the embedded Telegram bot. If the first attempt fails (e.g. because
 * Render's network is not yet fully ready right after a cold start), retry up
 * to MAX_RETRIES times with exponential back-off before giving up.
 */
async function launchBotWithRetry(token, attempt = 1) {
  const MAX_RETRIES = 5;
  const BACKOFF_MS = [0, 5000, 15000, 30000, 60000]; // delays before each attempt

  const delay = BACKOFF_MS[attempt - 1] || 60000;
  if (delay > 0) {
    console.log(`🤖 Bot launch attempt ${attempt}/${MAX_RETRIES} in ${delay / 1000}s...`);
    await new Promise((r) => setTimeout(r, delay));
  }

  try {
    console.log(`🤖 Starting embedded Telegram Bot (attempt ${attempt})...`);
    process.env.IS_EMBEDDED_BOT = 'true';
    const { createBot } = await import('../../bot/src/index.js');

    // Stop any previous stale instance before creating a new one
    if (botInstance) {
      try { botInstance.stop('RESTART'); } catch {}
      botInstance = null;
    }

    botInstance = createBot(token);
    await new Promise((resolve, reject) => {
      botInstance.launch(() => {
        console.log('🤖 Embedded Telegram Bot started successfully and listening for messages');
        global.__BOT_STATUS__ = { started: true, error: null, attempt, timestamp: new Date().toISOString() };
        resolve();
      }).catch(reject);
    });
  } catch (err) {
    const msg = err?.message || String(err);
    console.error(`🤖 Bot launch attempt ${attempt} failed: ${msg}`);
    global.__BOT_STATUS__ = { started: false, error: `Launch failed (attempt ${attempt}): ${msg}`, timestamp: new Date().toISOString() };

    if (attempt < MAX_RETRIES) {
      return launchBotWithRetry(token, attempt + 1);
    }
    console.error('🤖 All bot launch attempts exhausted. Bot will NOT be active.');
  }
}

const server = app.listen(config.port, async () => {
  console.log(`🚀 Relationship Awareness API running on port ${config.port} [${config.env}]`);
  console.log(`📡 Health Check: http://localhost:${config.port}/health`);

  // Optionally launch embedded Telegram Bot if configured to run inside API service (saves extra worker cost)
  if (config.embeddedBot) {
    if (config.bot.token && !config.bot.token.includes('SAMPLE_TOKEN')) {
      launchBotWithRetry(config.bot.token);
    } else {
      console.log('ℹ️ RUN_EMBEDDED_BOT is enabled, but TELEGRAM_BOT_TOKEN is not configured or is a placeholder.');
      global.__BOT_STATUS__ = { started: false, error: 'Token missing or placeholder', timestamp: new Date().toISOString() };
    }
  } else {
    global.__BOT_STATUS__ = { started: false, error: 'RUN_EMBEDDED_BOT is not true', timestamp: new Date().toISOString() };
  }

  // Keep the Render free-tier instance alive so the embedded bot never goes to sleep
  startKeepAlive(config.apiBaseUrl);
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
