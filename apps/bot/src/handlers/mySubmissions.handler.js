import { sessionStore } from '../sessions/sessionStore.js';
import { getMainMenuKeyboard } from '../keyboards/inlineKeyboards.js';
import { getTranslation, SubmissionStatus } from '@taw/shared';
import * as apiClient from '../services/apiClient.js';

export async function handleMySubmissions(ctx) {
  await ctx.answerCbQuery().catch(() => {});
  const telegramId = ctx.from.id;
  const session = await sessionStore.getSession(telegramId);
  const lang = session.language;
  const t = getTranslation(lang);

  try {
    const submissions = await apiClient.getUserSubmissions(telegramId);

    if (!submissions || submissions.length === 0) {
      await ctx.reply(t.submission.mySubmissionsEmpty, getMainMenuKeyboard(lang));
      return;
    }

    let response = `📋 **${t.menu.mySubmissions}** (${submissions.length})\n\n`;

    for (const sub of submissions) {
      let statusIcon = '⏳';
      let statusLabel = sub.status;

      if (sub.status === SubmissionStatus.PUBLISHED) {
        statusIcon = '✅';
        statusLabel = lang === 'am' ? 'ተለጥፏል' : 'Published';
      } else if (sub.status === SubmissionStatus.PENDING_REVIEW) {
        statusIcon = '⏳';
        statusLabel = lang === 'am' ? 'በግምገማ ላይ' : 'Under Review';
      } else if (sub.status === SubmissionStatus.READY_TO_PUBLISH) {
        statusIcon = '📋';
        statusLabel = lang === 'am' ? 'ለመለጠፍ የተዘጋጀ' : 'Ready to Publish';
      } else if (sub.status === SubmissionStatus.REJECTED) {
        statusIcon = '❌';
        statusLabel = lang === 'am' ? 'ተቀባይነት አላገኘም' : 'Rejected';
      } else if (sub.status === SubmissionStatus.REMOVED) {
        statusIcon = '🗑️';
        statusLabel = lang === 'am' ? 'ተሰርዟል' : 'Removed';
      }

      const dateStr = new Date(sub.createdAt).toLocaleDateString();
      const categoryName = lang === 'am' ? sub.category.nameAm : sub.category.nameEn;
      const snippet = sub.publicContent
        ? sub.publicContent.substring(0, 80) + (sub.publicContent.length > 80 ? '...' : '')
        : '';

      response += `• **#${sub.submissionNumber}** | ${categoryName}\n` +
        `  ${statusIcon} ${statusLabel} | 📅 ${dateStr}\n` +
        `  "${snippet}"\n`;

      if (sub.rejectionReason) {
        response += `  ⚠️ Reason: ${sub.rejectionReason}\n`;
      }

      response += '\n';
    }

    await ctx.reply(response, {
      parse_mode: 'Markdown',
      ...getMainMenuKeyboard(lang)
    });
  } catch (err) {
    console.error('Error fetching user submissions:', err.message);
    await ctx.reply('⚠️ Error loading submissions. Please try again.', getMainMenuKeyboard(lang));
  }
}
