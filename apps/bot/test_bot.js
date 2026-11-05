import dotenv from 'dotenv';
dotenv.config();

import { Telegraf } from 'telegraf';

console.log('=== BOT STARTUP DEBUG ===');
console.log('Token present:', !!process.env.TELEGRAM_BOT_TOKEN);
console.log('Token starts with:', process.env.TELEGRAM_BOT_TOKEN?.substring(0, 12));
console.log('NODE_ENV:', process.env.NODE_ENV);

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('FATAL: No bot token found');
  process.exit(1);
}

console.log('Creating Telegraf instance...');
const bot = new Telegraf(token);

bot.catch((err, ctx) => {
  console.error('Bot error:', err.message);
});

bot.command('start', async (ctx) => {
  console.log('Received /start from:', ctx.from.id);
  await ctx.reply('Hello! Bot is working! 🤖\n\nWelcome! 👋\nWelcome to our relationship awareness community.\n\nሰላም! 👋\nወደ ግንኙነት ግንዛቤ ማህበረሰባችን በደህና መጡ።');
});

bot.on('text', (ctx) => {
  console.log('Received text:', ctx.message.text);
});

console.log('Launching bot...');
bot.launch()
  .then(() => {
    console.log('✅ Bot launched successfully! Listening for messages...');
  })
  .catch((err) => {
    console.error('❌ Bot launch FAILED:', err.message);
    console.error('Full error:', err);
  });

process.once('SIGINT', () => { console.log('SIGINT'); bot.stop('SIGINT'); });
process.once('SIGTERM', () => { console.log('SIGTERM'); bot.stop('SIGTERM'); });

