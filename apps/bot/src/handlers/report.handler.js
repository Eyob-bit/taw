import { sessionStore } from '../sessions/sessionStore.js';
import { getMainMenuKeyboard } from '../keyboards/inlineKeyboards.js';
import { getTranslation } from '@taw/shared';
import * as apiClient from '../services/apiClient.js';

export async function handleReportCommand(ctx) {
  const telegramId = ctx.from.id;
  const session = await sessionStore.getSession(telegramId);
  const lang = session.language;

  const args = ctx.message.text.split(' ').slice(1);
  if (args.length < 2) {
    const usageMsg = lang === 'am'
      ? `🚨 **ጽሁፍ ሪፖርት ለማድረግ:**\n\nየትዕዛዙ አጠቃቀም፡\n\`/report <የጽሁፍ_UUID> <ምክንያት>\`\n\nምሳሌ፡\n\`/report a1b2c3d4-e5f6... ስም የሚያጠፋ መረጃ ተለጥፏል\``
      : `🚨 **To report a publication:**\n\nUsage:\n\`/report <PUBLICATION_UUID> <REASON>\`\n\nExample:\n\`/report a1b2c3d4-e5f6... Contains false accusation\``;

    await ctx.reply(usageMsg, { parse_mode: 'Markdown', ...getMainMenuKeyboard(lang) });
    return;
  }

  const publicationId = args[0];
  const reason = args.slice(1).join(' ');

  try {
    await apiClient.submitReport({
      publicationId,
      reporterTelegramId: telegramId,
      reason
    });

    const successMsg = lang === 'am'
      ? '✅ ሪፖርትዎ ደርሶናል! አወያዮቻችን በአፋጣኝ ይመለከቱታል።'
      : '✅ Your report has been submitted for immediate moderator review.';

    await ctx.reply(successMsg, getMainMenuKeyboard(lang));
  } catch (err) {
    const errorMsg = err.response?.data?.error || err.message;
    await ctx.reply(`⚠️ ${errorMsg}`, getMainMenuKeyboard(lang));
  }
}
