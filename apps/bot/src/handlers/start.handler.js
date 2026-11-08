import { sessionStore } from '../sessions/sessionStore.js';
import { getMainMenuKeyboard, getLanguageKeyboard } from '../keyboards/inlineKeyboards.js';
import { getTranslation } from '@taw/shared';
import * as apiClient from '../services/apiClient.js';

export const WELCOME_MESSAGE = `Welcome! 👋\nWelcome to our relationship awareness community.\nYou can anonymously submit questions and share personal experiences.\n\nሰላም! 👋\nወደ ግንኙነት ግንዛቤ ማህበረሰባችን በደህና መጡ።\nጥያቄዎችን ማንሳት እና የግል ተሞክሮዎችን በሚስጥር ማጋራት ይችላሉ።`;

/**
 * Background synchronization helper for nonessential tasks:
 * - Upsert/sync persistent session record in database
 * - Register/update user profile in backend database
 *
 * Runs asynchronously without delaying the welcome response to the user.
 */
export async function syncUserInBackground({ telegramId, username, firstName, lastName, lang }) {
  try {
    const session = await sessionStore.getSession(telegramId);
    const effectiveLang = session?.language || lang;

    await apiClient.registerUser({
      telegramId,
      telegramUsername: username,
      firstName,
      lastName,
      languageCode: effectiveLang
    });
  } catch (err) {
    console.error('[handleStart] Background sync task error:', err?.message || err);
  }
}

/**
 * Fast /start handler:
 * Sends the bilingual welcome message and main menu keyboard almost instantly.
 * Does not block on database queries, backend API calls, or profile syncs.
 */
export async function handleStart(ctx) {
  if (!ctx || !ctx.from || !ctx.from.id) {
    console.warn('[handleStart] Received update without valid ctx.from.id');
    return;
  }

  const telegramId = ctx.from.id;
  const username = ctx.from.username || null;
  const firstName = ctx.from.first_name || '';
  const lastName = ctx.from.last_name || '';

  // Resolve language immediately from in-memory cache or Telegram user preference
  let lang = 'am';
  if (typeof sessionStore.getCachedLanguage === 'function') {
    const cached = sessionStore.getCachedLanguage(telegramId);
    if (cached) {
      lang = cached;
    } else if (ctx.from.language_code && ctx.from.language_code.toLowerCase().startsWith('en')) {
      lang = 'en';
    }
  } else if (ctx.from.language_code && ctx.from.language_code.toLowerCase().startsWith('en')) {
    lang = 'en';
  }

  // 1. Immediately send the welcome message without waiting for DB or API requests
  try {
    await ctx.reply(WELCOME_MESSAGE, getMainMenuKeyboard(lang));
  } catch (err) {
    console.error('[handleStart] Failed to send welcome reply:', err.message);
    return;
  }

  // 2. Offload nonessential user registration & session persistence to background
  setImmediate(() => {
    syncUserInBackground({
      telegramId,
      username,
      firstName,
      lastName,
      lang
    });
  });
}

export async function handleLanguageMenu(ctx) {
  await ctx.answerCbQuery().catch(() => {});
  const text = `🌐 Please choose your language / እባክዎ ቋንቋ ይምረጡ:`;
  await ctx.reply(text, getLanguageKeyboard());
}

export async function handleSetLanguage(ctx, lang) {
  await ctx.answerCbQuery().catch(() => {});
  const telegramId = ctx.from.id;

  await sessionStore.updateSession(telegramId, { language: lang });

  try {
    await apiClient.registerUser({
      telegramId,
      languageCode: lang
    });
  } catch (err) {
    console.error('Failed to update language in backend:', err.message);
  }

  const t = getTranslation(lang);
  await ctx.reply(t.welcome.languageChanged, getMainMenuKeyboard(lang));
}
