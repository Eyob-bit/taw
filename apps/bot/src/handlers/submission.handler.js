import { sessionStore } from '../sessions/sessionStore.js';
import {
  getMainMenuKeyboard,
  getGuidelinesKeyboard,
  getPreviewKeyboard,
  getCancelKeyboard
} from '../keyboards/inlineKeyboards.js';
import {
  getTranslation,
  CategoryCode,
  validateSubmissionText,
  evaluateEligibility,
  sanitizeText
} from '@taw/shared';
import * as apiClient from '../services/apiClient.js';

// When user sends an album (media group), Telegram sends each photo as a separate
// update with the SAME media_group_id. We buffer them for a short window then process.
const mediaGroupBuffer = new Map(); // mediaGroupId -> { telegramId, photos: [], timer }
const ALBUM_COLLECT_DELAY_MS = 800;

export async function handleCategorySelect(ctx, categoryCode) {
  await ctx.answerCbQuery().catch(() => {});
  const telegramId = ctx.from.id;
  const session = await sessionStore.getSession(telegramId);
  const t = getTranslation(session.language);

  await sessionStore.updateSession(telegramId, {
    draftCategory: categoryCode
  });

  if (!session.hasAgreedGuidelines) {
    const guidelinesText = `${t.guidelines.title}\n\n${t.guidelines.intro}\n\n` +
      `${t.guidelines.rule1}\n\n` +
      `${t.guidelines.rule2}\n\n` +
      `${t.guidelines.rule3}\n\n` +
      `${t.guidelines.rule4}`;
    await ctx.reply(guidelinesText, getGuidelinesKeyboard(session.language));
    return;
  }

  await promptForContent(ctx, categoryCode, session.language);
}

export async function handleAgreeGuidelines(ctx) {
  await ctx.answerCbQuery().catch(() => {});
  const telegramId = ctx.from.id;
  const session = await sessionStore.getSession(telegramId);
  await sessionStore.updateSession(telegramId, { hasAgreedGuidelines: true });
  await promptForContent(ctx, session.draftCategory || CategoryCode.ARE_WE_DATING, session.language);
}

async function promptForContent(ctx, categoryCode, lang) {
  const telegramId = ctx.from.id;
  const t = getTranslation(lang);

  await sessionStore.updateSession(telegramId, {
    state: 'WAITING_FOR_CONTENT',
    draftCategory: categoryCode,
    draftOriginalContent: null,
    draftPublicContent: null,
    metadata: {}
  });

  const promptText = categoryCode === CategoryCode.ARE_WE_DATING
    ? t.submission.promptAreWeDating
    : t.submission.promptSafety;

  await ctx.reply(promptText, getCancelKeyboard(lang));
}

async function buildAndSendPreview(ctx, { telegramId, session, text, photoFileIds, lang, t }) {
  const analysis = evaluateEligibility({
    text,
    categoryCode: session.draftCategory,
    hasAttachments: photoFileIds.length > 0
  });

  const sanitized = sanitizeText(text);

  await sessionStore.updateSession(telegramId, {
    state: 'WAITING_FOR_CONFIRMATION',
    draftOriginalContent: text,
    draftPublicContent: sanitized,
    metadata: { ...(session.metadata || {}), photoFileIds }
  });

  const categoryName = session.draftCategory === CategoryCode.ARE_WE_DATING
    ? t.menu.areWeDating
    : t.menu.safetyConcern;

  let previewMsg = `${t.submission.previewTitle}\n\n` +
    `📂 **${t.submission.categoryLabel}**: ${categoryName}\n\n` +
    `💬 **${t.submission.contentLabel}**:\n${sanitized}\n\n`;

  if (analysis.piiDetections.length > 0 || analysis.sensitiveAllegations.length > 0) {
    previewMsg += `${t.submission.piiWarning}\n\n`;
  }

  previewMsg += t.submission.confirmPrompt;

  if (photoFileIds.length === 1) {
    await ctx.replyWithPhoto(photoFileIds[0], {
      caption: previewMsg,
      parse_mode: 'Markdown',
      ...getPreviewKeyboard(lang)
    });
  } else if (photoFileIds.length > 1) {
    // Send album preview first, then text with keyboard
    await ctx.replyWithMediaGroup(
      photoFileIds.map((id, i) => ({
        type: 'photo',
        media: id,
        ...(i === 0 ? { caption: `📸 ${photoFileIds.length} photos attached` } : {})
      }))
    );
    await ctx.reply(previewMsg, {
      parse_mode: 'Markdown',
      ...getPreviewKeyboard(lang)
    });
  } else {
    await ctx.reply(previewMsg, {
      parse_mode: 'Markdown',
      ...getPreviewKeyboard(lang)
    });
  }
}

/**
 * Handle photo messages — supports single photo AND album (multiple photos).
 * Telegram sends each photo in an album as a separate update with the same media_group_id.
 * We buffer them for ALBUM_COLLECT_DELAY_MS ms then process all together.
 */
export async function handlePhotoMessage(ctx) {
  const telegramId = ctx.from.id;
  const session = await sessionStore.getSession(telegramId);

  if (session.state !== 'WAITING_FOR_CONTENT') return;

  const photos = ctx.message.photo;
  if (!photos || photos.length === 0) return;

  const largestPhoto = photos[photos.length - 1];
  const photoFileId = largestPhoto.file_id;
  const mediaGroupId = ctx.message.media_group_id;
  const caption = ctx.message.caption || '';
  const lang = session.language;
  const t = getTranslation(lang);

  if (mediaGroupId) {
    // Album — buffer photos, wait for the rest
    if (!mediaGroupBuffer.has(mediaGroupId)) {
      mediaGroupBuffer.set(mediaGroupId, {
        telegramId,
        lang,
        caption,
        photoFileIds: [],
        timer: null
      });
    }

    const entry = mediaGroupBuffer.get(mediaGroupId);
    entry.photoFileIds.push(photoFileId);
    if (!entry.caption && caption) entry.caption = caption;

    // Reset timer on each new photo in the group
    if (entry.timer) clearTimeout(entry.timer);
    entry.timer = setTimeout(async () => {
      mediaGroupBuffer.delete(mediaGroupId);
      await processPhotos(ctx, telegramId, session, entry.photoFileIds, entry.caption, lang, t);
    }, ALBUM_COLLECT_DELAY_MS);
  } else {
    // Single photo
    await processPhotos(ctx, telegramId, session, [photoFileId], caption, lang, t);
  }
}

async function processPhotos(ctx, telegramId, session, photoFileIds, caption, lang, t) {
  // Re-fetch session in case it changed
  const freshSession = await sessionStore.getSession(telegramId);

  if (caption && caption.trim().length > 0) {
    // Photo(s) sent with caption — caption is the text
    const text = caption.trim();
    const validation = validateSubmissionText(text, true);
    if (!validation.isValid) {
      await ctx.reply(
        validation.errorKey === 'tooShort' ? t.submission.tooShort : t.submission.tooLong,
        getCancelKeyboard(lang)
      );
      return;
    }
    await buildAndSendPreview(ctx, { telegramId, session: freshSession, text, photoFileIds, lang, t });
    return;
  }

  // No caption — check if text was already provided
  if (freshSession.draftOriginalContent && freshSession.draftOriginalContent.trim().length > 0) {
    const text = freshSession.draftOriginalContent.trim();
    await buildAndSendPreview(ctx, { telegramId, session: freshSession, text, photoFileIds, lang, t });
    return;
  }

  // Photos only, no text yet — store and ask for text
  const existingPhotoFileIds = freshSession.metadata?.photoFileIds || [];
  const allPhotoFileIds = [...existingPhotoFileIds, ...photoFileIds];

  await sessionStore.updateSession(telegramId, {
    metadata: { ...(freshSession.metadata || {}), photoFileIds: allPhotoFileIds }
  });

  if (allPhotoFileIds.length === 1) {
    await ctx.reply(t.submission.photoReceivedNeedText, getCancelKeyboard(lang));
  } else {
    await ctx.reply(
      `📸 ${allPhotoFileIds.length} photos received! Now please send your text description.`,
      getCancelKeyboard(lang)
    );
  }
}

export async function handleTextMessage(ctx) {
  const telegramId = ctx.from.id;
  const session = await sessionStore.getSession(telegramId);

  if (session.state !== 'WAITING_FOR_CONTENT') return;

  const text = (ctx.message.text || '').trim();
  const lang = session.language;
  const t = getTranslation(lang);
  const existingPhotoFileIds = session.metadata?.photoFileIds || [];

  const validation = validateSubmissionText(text, existingPhotoFileIds.length > 0);
  if (!validation.isValid) {
    await ctx.reply(
      validation.errorKey === 'tooShort' ? t.submission.tooShort : t.submission.tooLong,
      getCancelKeyboard(lang)
    );
    return;
  }

  if (existingPhotoFileIds.length > 0) {
    // Text received after photos
    await buildAndSendPreview(ctx, { telegramId, session, text, photoFileIds: existingPhotoFileIds, lang, t });
    return;
  }

  // Text only received — store and ask for photo
  const sanitized = sanitizeText(text);
  await sessionStore.updateSession(telegramId, {
    draftOriginalContent: text,
    draftPublicContent: sanitized
  });
  await ctx.reply(t.submission.textReceivedNeedPhoto, getCancelKeyboard(lang));
}

export async function handleConfirmSubmit(ctx) {
  await ctx.answerCbQuery().catch(() => {});
  const telegramId = ctx.from.id;
  const session = await sessionStore.getSession(telegramId);
  const lang = session.language;
  const t = getTranslation(lang);

  const photoFileIds = session.metadata?.photoFileIds || [];

  if (!session.draftOriginalContent || !session.draftCategory) {
    await ctx.reply(t.submission.cancelled, getMainMenuKeyboard(lang));
    await sessionStore.resetSession(telegramId);
    return;
  }

  if (photoFileIds.length === 0) {
    await ctx.reply(t.submission.photoRequired, getCancelKeyboard(lang));
    return;
  }

  try {
    const submission = await apiClient.createSubmission({
      telegramId,
      categoryCode: session.draftCategory,
      content: session.draftOriginalContent,
      language: lang,
      photoFileIds
    });

    await sessionStore.resetSession(telegramId);

    if (submission.isEligibleForAutoPublish) {
      await ctx.reply(t.submission.submittedSuccessAuto, getMainMenuKeyboard(lang));
    } else {
      await ctx.reply(t.submission.submittedSuccessReview, getMainMenuKeyboard(lang));
    }
  } catch (err) {
    console.error('Error creating submission:', err.message);
    const errorMsg = err.response?.data?.error || err.message;
    await ctx.reply(`⚠️ ${errorMsg}`, getMainMenuKeyboard(lang));
    await sessionStore.resetSession(telegramId);
  }
}

export async function handleCancel(ctx) {
  await ctx.answerCbQuery().catch(() => {});
  const telegramId = ctx.from.id;
  const session = await sessionStore.getSession(telegramId);
  const t = getTranslation(session.language);
  await sessionStore.resetSession(telegramId);
  await ctx.reply(t.submission.cancelled, getMainMenuKeyboard(session.language));
}

export async function handleEditText(ctx) {
  await ctx.answerCbQuery().catch(() => {});
  const telegramId = ctx.from.id;
  const session = await sessionStore.getSession(telegramId);
  const t = getTranslation(session.language);

  await sessionStore.updateSession(telegramId, { state: 'WAITING_FOR_CONTENT' });

  const photoCount = session.metadata?.photoFileIds?.length || 0;
  const promptText = photoCount > 0
    ? t.submission.photoReceivedNeedText
    : (session.draftCategory === CategoryCode.ARE_WE_DATING
        ? t.submission.promptAreWeDating
        : t.submission.promptSafety);

  await ctx.reply(`✏️ ${promptText}`, getCancelKeyboard(session.language));
}
