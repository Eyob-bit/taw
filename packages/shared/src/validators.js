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

/**
 * Format a channel publication message with hashtag, body, disclaimer, and privacy note
 */
export function formatPublicationPost({ categoryCode, publicContent, language = SupportedLanguages.AM, publicationNumber }) {
  const t = getTranslation(language);
  const hashtag = categoryCode === CategoryCode.ARE_WE_DATING
    ? Hashtags.ARE_WE_DATING
    : Hashtags.RELATIONSHIP_SAFETY;

  const disclaimer = categoryCode === CategoryCode.ARE_WE_DATING
    ? t.publication.disclaimerAreWeDating
    : t.publication.disclaimerSafety;

  const header = publicationNumber ? `${hashtag} #${publicationNumber}` : hashtag;

  return `${header}\n\n${publicContent.trim()}\n\n---\n${disclaimer}`;
}

/**
 * Check if a language code is supported
 */
export function isSupportedLanguage(lang) {
  return Object.values(SupportedLanguages).includes(lang);
}

