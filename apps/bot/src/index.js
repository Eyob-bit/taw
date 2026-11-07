import { Telegraf } from 'telegraf';
import { config } from './config/index.js';
import { CategoryCode } from '@taw/shared';

import { handleStart, handleLanguageMenu, handleSetLanguage } from './handlers/start.handler.js';
import {
  handleCategorySelect,
  handleAgreeGuidelines,
  handleTextMessage,
  handlePhotoMessage,
  handleConfirmSubmit,
  handleCancel,
  handleEditText
} from './handlers/submission.handler.js';
import { handleMySubmissions } from './handlers/mySubmissions.handler.js';
import { handleHelp } from './handlers/help.handler.js';
import { handleReportCommand } from './handlers/report.handler.js';

export function createBot(token = config.botToken) {
  const bot = new Telegraf(token);

  // Global Error Handler
  bot.catch((err, ctx) => {
    console.error(`[Bot Error] encountered error for update ${ctx?.updateType}:`, err);
  });

  // Commands
  bot.command('start', handleStart);
  bot.command('help', handleHelp);
  bot.command('cancel', handleCancel);
  bot.command('language', handleLanguageMenu);
  bot.command('my_submissions', handleMySubmissions);
  bot.command('report', handleReportCommand);

  // Category selection callbacks
  bot.action('cat_are_we_dating', (ctx) => handleCategorySelect(ctx, CategoryCode.ARE_WE_DATING));
  bot.action('cat_safety_concern', (ctx) => handleCategorySelect(ctx, CategoryCode.RELATIONSHIP_SAFETY));

  // Flow callbacks
  bot.action('action_agree_guidelines', handleAgreeGuidelines);
  bot.action('action_confirm_submit', handleConfirmSubmit);
  bot.action('action_cancel', handleCancel);
  bot.action('action_edit_text', handleEditText);

  // Menu callbacks
  bot.action('menu_my_submissions', handleMySubmissions);
  bot.action('menu_help', handleHelp);
  bot.action('menu_language', handleLanguageMenu);

  // Language callbacks
  bot.action('lang_am', (ctx) => handleSetLanguage(ctx, 'am'));
  bot.action('lang_en', (ctx) => handleSetLanguage(ctx, 'en'));

  // Listen for photos and texts for submissions
  bot.on('photo', handlePhotoMessage);
  bot.on('text', handleTextMessage);

  // If user sends a non-photo document
  bot.on('document', async (ctx) => {
    await ctx.reply(
      '⚠️ Please send the image as a standard photo (compressed), not as an uncompressed file document.',
      { reply_to_message_id: ctx.message.message_id }
    );
  });

  return bot;
}

// Auto-start in non-test mode if running as standalone bot (not embedded inside API service)
if (process.env.NODE_ENV !== 'test' && process.env.IS_EMBEDDED_BOT !== 'true') {
  if (config.botToken && !config.botToken.includes('SAMPLE_TOKEN')) {
    const bot = createBot();

    // In Telegraf v4, launch() returns a promise that never resolves
    // because it awaits the infinite polling loop. Use the onLaunch
    // callback (2nd arg) which fires after getMe() succeeds.
    bot.launch(
      () => console.log('🤖 Telegram Bot started successfully and listening for messages')
    ).catch((err) => console.error('Failed to launch bot:', err.message));

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } else {
    console.log('ℹ️ Bot token is a sample placeholder. Bot initialized in standby mode. Set TELEGRAM_BOT_TOKEN to launch polling.');
  }
}
