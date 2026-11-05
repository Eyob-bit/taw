import { CategoryCode } from './constants.js';

// Regex patterns
const ETHIOPIAN_PHONE_REGEX = /(?:\+251|00251|0)?([97]\d{8})\b/g;
const GENERAL_PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const SOCIAL_HANDLE_REGEX = /@[A-Za-z0-9_]{3,32}\b/g;
const URL_REGEX = /(?:https?:\/\/|www\.|t\.me\/|instagram\.com\/|facebook\.com\/|tiktok\.com\/)[^\s]+/gi;

// Sensitive allegation terms in English and Amharic
const SENSITIVE_TERMS = [
  // English
  'rape', 'assault', 'steal', 'thief', 'scammer', 'fraud', 'std', 'hiv', 'disease',
  'abuse', 'violence', 'crime', 'police', 'blackmail', 'extort',
  // Amharic
  'ደፈረ', 'ደፋሪ', 'ሌባ', 'አጭበርባሪ', 'ሰረቀ', 'በሽታ', 'ኤችአይቪ', 'ደበደበ', 'ጥቃት', 'ፖሊስ'
];

/**
 * Detect PII and sensitive identifiers in text
 */
export function detectPII(text = '') {
  const detections = [];

  let match;
  // Ethiopian Phones
  const ethioRegex = new RegExp(ETHIOPIAN_PHONE_REGEX.source, 'gi');
  while ((match = ethioRegex.exec(text)) !== null) {
    detections.push({ type: 'PHONE', match: match[0], index: match.index });
  }

  // General Phones
  const genPhoneRegex = new RegExp(GENERAL_PHONE_REGEX.source, 'gi');
  while ((match = genPhoneRegex.exec(text)) !== null) {
    if (!detections.some(d => d.type === 'PHONE' && d.match.includes(match[0]))) {
      detections.push({ type: 'PHONE', match: match[0], index: match.index });
    }
  }

  // Emails
  const emailRegex = new RegExp(EMAIL_REGEX.source, 'gi');
  while ((match = emailRegex.exec(text)) !== null) {
    detections.push({ type: 'EMAIL', match: match[0], index: match.index });
  }

  // Handles (@username)
  const handleRegex = new RegExp(SOCIAL_HANDLE_REGEX.source, 'gi');
  while ((match = handleRegex.exec(text)) !== null) {
    detections.push({ type: 'HANDLE', match: match[0], index: match.index });
  }

  // URLs
  const urlRegex = new RegExp(URL_REGEX.source, 'gi');
  while ((match = urlRegex.exec(text)) !== null) {
    detections.push({ type: 'URL', match: match[0], index: match.index });
  }

  return detections;
}

/**
 * Detect sensitive allegations or severe claims
 */
export function detectSensitiveAllegations(text = '') {
  const lower = text.toLowerCase();
  const matchedTerms = [];

  for (const term of SENSITIVE_TERMS) {
    if (lower.includes(term.toLowerCase())) {
      matchedTerms.push(term);
    }
  }

  return matchedTerms;
}

/**
 * Replace detected PII with neutral redacted placeholder
 */
export function sanitizeText(text = '') {
  if (!text) return '';

  return text
    .replace(ETHIOPIAN_PHONE_REGEX, '[የስልክ ቁጥር ተወግዷል / Phone Removed]')
    .replace(GENERAL_PHONE_REGEX, '[ስልክ ተወግዷል / Phone Removed]')
    .replace(EMAIL_REGEX, '[ኢሜይል ተወግዷል / Email Removed]')
    .replace(SOCIAL_HANDLE_REGEX, '[መለያ ተወግዷል / Handle Removed]')
    .replace(URL_REGEX, '[ሊንክ ተወግዷል / Link Removed]');
}

/**
 * Analyze submission eligibility for auto-publishing vs moderator review
 */
export function evaluateEligibility({ text, categoryCode, hasAttachments = false }) {
  const piiDetections = detectPII(text);
  const sensitiveAllegations = detectSensitiveAllegations(text);
  const reasons = [];

  // Rule 1: Relationship Safety category ALWAYS requires human review
  if (categoryCode === CategoryCode.RELATIONSHIP_SAFETY) {
    reasons.push('Relationship Safety submissions strictly require human moderator review before publication.');
  }

  // Rule 2: Submissions with attachments (photos/evidence) in Safety category ALWAYS require human review
  if (hasAttachments && categoryCode === CategoryCode.RELATIONSHIP_SAFETY) {
    reasons.push('Safety submissions with attachments require manual review to evaluate submitted evidence.');
  }

  // Rule 3: Direct contact details or handles require review
  if (piiDetections.length > 0) {
    reasons.push(`Contains contact details or identifiers (${piiDetections.map(d => d.type).join(', ')}).`);
  }

  // Rule 4: Potentially defamatory allegations or severe keywords require review
  if (sensitiveAllegations.length > 0) {
    reasons.push(`Contains sensitive claim keywords (${sensitiveAllegations.slice(0, 3).join(', ')}).`);
  }

  const isEligibleForAutoPublish = reasons.length === 0 && categoryCode === CategoryCode.ARE_WE_DATING;

  return {
    isEligibleForAutoPublish,
    reasons,
    piiDetections,
    sensitiveAllegations,
    sanitizedContent: sanitizeText(text)
  };
}

