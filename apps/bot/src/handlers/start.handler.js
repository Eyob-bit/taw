import { sessionStore } from '../sessions/sessionStore.js';
import { getMainMenuKeyboard, getLanguageKeyboard } from '../keyboards/inlineKeyboards.js';
import { getTranslation } from '@taw/shared';
import * as apiClient from '../services/apiClient.js';

export async function handleStart(ctx) {
  const telegramId = ctx.from.id;
  const username = ctx.from.username || null;
  const firstName = ctx.from.first_name || '';
  const lastName = ctx.from.last_name || '';

  const session = await sessionStore.getSession(telegramId);

  // Register or update user in backend database
  try {
    await apiClient.registerUser({
      telegramId,
      telegramUsername: username,
      firstName,
      lastName,
      languageCode: session.language
    });
  } catch (err) {
    console.error('Failed to sync user with backend:', err.message);
  }

  const welcomeText = `Welcome! 👋\nWelcome to our relationship awareness community.\nYou can anonymously submit questions and share personal experiences.\n\nሰላም! 👋\nወደ ግንኙነት ግንዛቤ ማህበረሰባችን በደህና መጡ።\nጥያቄዎችን ማንሳት እና የግል ተሞክሮዎችን በሚስጥር ማጋራት ይችላሉ።`;

  await ctx.reply(welcomeText, getMainMenuKeyboard(session.language));
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
