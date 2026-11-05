import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  CategoryCode,
  detectPII,
  sanitizeText,
  evaluateEligibility,
  validateSubmissionText,
  formatPublicationPost
} from '../src/index.js';

describe('Shared Package Tests', () => {
  it('detects Ethiopian phone numbers and handles', () => {
    const text = 'Call 0911234567 or reach @abebe_kebede for info';
    const pii = detectPII(text);
    assert.strictEqual(pii.length, 2);
    assert.strictEqual(pii[0].type, 'PHONE');
    assert.strictEqual(pii[1].type, 'HANDLE');
  });

  it('sanitizes text properly', () => {
    const text = 'Reach me at 0911234567 or @myhandle';
    const sanitized = sanitizeText(text);
    assert.ok(!sanitized.includes('0911234567'));
    assert.ok(!sanitized.includes('@myhandle'));
    assert.ok(sanitized.includes('[የስልክ ቁጥር ተወግዷል / Phone Removed]'));
  });

  it('routes safety category to moderator review even if clean text', () => {
    const text = 'This is a clean description of an experience that has more than 30 characters.';
    const result = evaluateEligibility({ text, categoryCode: CategoryCode.RELATIONSHIP_SAFETY });
    assert.strictEqual(result.isEligibleForAutoPublish, false);
    assert.ok(result.reasons.some(r => r.includes('strictly require human moderator review')));
  });

  it('permits clean ARE_WE_DATING question for auto publish', () => {
    const text = 'We met in Bole around November. He says he is a 28 year old engineer named Natnael.';
    const result = evaluateEligibility({ text, categoryCode: CategoryCode.ARE_WE_DATING });
    assert.strictEqual(result.isEligibleForAutoPublish, true);
    assert.strictEqual(result.reasons.length, 0);
  });

  it('validates text lengths', () => {
    assert.strictEqual(validateSubmissionText('short').isValid, false);
    assert.strictEqual(validateSubmissionText('This is long enough text for a proper question submission in Ethiopia.').isValid, true);
  });

  it('formats publication post with disclaimers', () => {
    const post = formatPublicationPost({
      categoryCode: CategoryCode.ARE_WE_DATING,
      publicContent: 'Has anyone seen this person around Piassa?',
      language: 'am',
      publicationNumber: 101
    });
    assert.ok(post.includes('#are_we_dating_the_same_guy #101'));
    assert.ok(post.includes('⚠️ ይህ ጥያቄ ብቻ ነው'));
  });
});

