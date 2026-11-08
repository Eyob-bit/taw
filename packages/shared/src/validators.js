import { CategoryCode, Hashtags, ContentLimits, SupportedLanguages } from './constants.js';
import { getTranslation } from './i18n.js';

/**
 * Validate submission text length
 */
export function validateSubmissionText(text = '', hasPhoto = false) {
  const trimmed = text.trim();
  const minLength = hasPhoto ? 10 : ContentLimits.MIN_SUBMISSION_LENGTH;
  if (trimmed.length < minLength) {
    return {
      isValid: false,
      errorKey: 'tooShort',
      message: `Content must be at least ${minLength} characters.`
    };
  }

  if (trimmed.length > ContentLimits.MAX_SUBMISSION_LENGTH) {
    return {
      isValid: false,
      errorKey: 'tooLong',
      message: `Content must be at most ${ContentLimits.MAX_SUBMISSION_LENGTH} characters.`
    };
  }

  return { isValid: true, errorKey: null, message: null };
}

export const POST_FOOTER_AM = `ማንኛውም መረጃ ወይም ወሬ ካላሽ በ @tawkiwalesh_bot በኩል ላኪልን::\n\n❗️ ❗️ እንጠንቀቅ`;
export const POST_FOOTER_EN = `If you have any info or news, send it to us via @tawkiwalesh_bot::\n\n❗️ ❗️ Be careful`;
export const POST_FOOTER = POST_FOOTER_AM;

/**
 * Format a channel publication message with user text followed by standard community footer
 */
export function formatPublicationPost({ publicContent, language = 'am' }) {
  const content = (publicContent || '').trim();
  const footer = language === 'en' ? POST_FOOTER_EN : POST_FOOTER_AM;
  return `${content}\n\n${footer}`;
}

/**
 * Check if a language code is supported
 */
export function isSupportedLanguage(lang) {
  return Object.values(SupportedLanguages).includes(lang);
}
