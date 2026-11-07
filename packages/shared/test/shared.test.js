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

  it('preserves text without removing names or handles', () => {
    const text = 'Reach me at 0911234567 or @myhandle with Natnael';
    const sanitized = sanitizeText(text);
    assert.strictEqual(sanitized, text);
    assert.ok(sanitized.includes('@myhandle'));
    assert.ok(sanitized.includes('Natnael'));
  });

  it('routes all submissions to manual moderator review', () => {
    const text = 'We met in Bole around November. He says he is a 28 year old engineer named Natnael.';
    const result = evaluateEligibility({ text, categoryCode: CategoryCode.ARE_WE_DATING });
    assert.strictEqual(result.isEligibleForAutoPublish, false);
    assert.ok(result.reasons.some(r => r.includes('manual review')));
  });

  it('validates text lengths', () => {
    assert.strictEqual(validateSubmissionText('short').isValid, false);
    assert.strictEqual(validateSubmissionText('This is long enough text for a proper question submission in Ethiopia.').isValid, true);
  });

  it('formats publication post with user text and exact footer', () => {
    const post = formatPublicationPost({
      publicContent: 'Has anyone seen this person around Piassa?'
    });
    assert.ok(post.startsWith('Has anyone seen this person around Piassa?'));
    assert.ok(post.includes('ማንኛውም መረጃ ወይም ወሬ ካላሽ በ @tawkiwalesh_bot በኩል አግኙን::'));
    assert.ok(post.includes('❗️❗️እንጠንቀቅ'));
  });
});

