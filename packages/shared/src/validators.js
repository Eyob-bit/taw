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

export const POST_FOOTER = `ማንኛውም መረጃ ወይም ወሬ ካላሽ በ @tawkiwalesh_bot በኩል አግኙ::\n\n❗️❗️እንጠንቀቅ`;

/**
 * Format a channel publication message with user text followed by standard community footer
 */
export function formatPublicationPost({ publicContent }) {
  const content = (publicContent || '').trim();
  return `${content}\n\n${POST_FOOTER}`;
}

/**
 * Check if a language code is supported
 */
export function isSupportedLanguage(lang) {
  return Object.values(SupportedLanguages).includes(lang);
}

