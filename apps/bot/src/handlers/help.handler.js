import { sessionStore } from '../sessions/sessionStore.js';
import { getMainMenuKeyboard } from '../keyboards/inlineKeyboards.js';
import { getTranslation } from '@taw/shared';

export async function handleHelp(ctx) {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery().catch(() => {});
  }

  const telegramId = ctx.from.id;
  const session = await sessionStore.getSession(telegramId);
  const lang = session.language;
  const t = getTranslation(lang);

  await ctx.reply(t.help.content, {
    parse_mode: 'Markdown',
    ...getMainMenuKeyboard(lang)
  });
}
