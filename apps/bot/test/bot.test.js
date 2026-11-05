import { describe, it, expect, beforeEach } from 'vitest';
import { createBot } from '../src/index.js';
import { sessionStore } from '../src/sessions/sessionStore.js';
import { getMainMenuKeyboard, getGuidelinesKeyboard } from '../src/keyboards/inlineKeyboards.js';
import { CategoryCode } from '@taw/shared';

describe('Telegram Bot Handler Tests', () => {
  const mockTelegramId = '777888999';

  beforeEach(async () => {
    await sessionStore.resetSession(mockTelegramId);
  });

  it('initializes Telegraf bot instance without error', () => {
    const bot = createBot('123456789:ABCdefGHIjklMNOpqrsTUVwxyz_SAMPLE_TOKEN');
    expect(bot).toBeDefined();
    expect(typeof bot.command).toBe('function');
    expect(typeof bot.action).toBe('function');
  });

  it('manages persistent sessions in PostgreSQL', async () => {
    const session = await sessionStore.getSession(mockTelegramId);
    expect(session).toBeDefined();
    expect(session.state).toBe('IDLE');

    await sessionStore.updateSession(mockTelegramId, {
      state: 'WAITING_FOR_CONTENT',
      draftCategory: CategoryCode.ARE_WE_DATING,
      language: 'am'
    });

    const updated = await sessionStore.getSession(mockTelegramId);
    expect(updated.state).toBe('WAITING_FOR_CONTENT');
    expect(updated.draftCategory).toBe(CategoryCode.ARE_WE_DATING);
    expect(updated.language).toBe('am');

    await sessionStore.resetSession(mockTelegramId);
    const reset = await sessionStore.getSession(mockTelegramId);
    expect(reset.state).toBe('IDLE');
    expect(reset.draftCategory).toBeNull();
  });

  it('builds bilingual main menu keyboards properly', () => {
    const amKeyboard = getMainMenuKeyboard('am');
    const enKeyboard = getMainMenuKeyboard('en');

    expect(amKeyboard.reply_markup.inline_keyboard.length).toBeGreaterThan(0);
    expect(enKeyboard.reply_markup.inline_keyboard.length).toBeGreaterThan(0);

    const amText = JSON.stringify(amKeyboard);
    const enText = JSON.stringify(enKeyboard);

    expect(amText).toContain('እኛ አንድ ሰው ጋር');
    expect(enText).toContain('Are We Dating');
  });

  it('builds guidelines agreement keyboards', () => {
    const amGuidelines = getGuidelinesKeyboard('am');
    const enGuidelines = getGuidelinesKeyboard('en');

    expect(JSON.stringify(amGuidelines)).toContain('ተረድቻለሁ');
    expect(JSON.stringify(enGuidelines)).toContain('Understand');
  });
});
