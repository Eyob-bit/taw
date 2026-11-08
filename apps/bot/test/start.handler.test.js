import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  handleStart,
  handleLanguageMenu,
  handleSetLanguage,
  syncUserInBackground,
  WELCOME_MESSAGE
} from '../src/handlers/start.handler.js';
import { sessionStore } from '../src/sessions/sessionStore.js';
import * as apiClient from '../src/services/apiClient.js';

describe('Start Handler Optimization and Response Flow', () => {
  let mockCtx;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockCtx = {
      from: {
        id: 12345678,
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        language_code: 'am'
      },
      reply: vi.fn().mockResolvedValue(true),
      answerCbQuery: vi.fn().mockResolvedValue(true)
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves the exact bilingual welcome message', () => {
    expect(WELCOME_MESSAGE).toContain('Welcome! 👋');
    expect(WELCOME_MESSAGE).toContain('Welcome to our relationship awareness community.');
    expect(WELCOME_MESSAGE).toContain('ሰላም! 👋');
    expect(WELCOME_MESSAGE).toContain('ወደ ግንኙነት ግንዛቤ ማህበረሰባችን በደህና መጡ።');
  });

  it('sends welcome message immediately without waiting for sessionStore or apiClient', async () => {
    let apiClientCalled = false;
    let sessionStoreCalled = false;

    // Simulate slow/delayed backend operations
    vi.spyOn(sessionStore, 'getSession').mockImplementation(async () => {
      sessionStoreCalled = true;
      return { language: 'am' };
    });

    vi.spyOn(apiClient, 'registerUser').mockImplementation(async () => {
      apiClientCalled = true;
      return { success: true };
    });

    // Invoke handleStart
    await handleStart(mockCtx);

    // reply MUST have been called immediately
    expect(mockCtx.reply).toHaveBeenCalledTimes(1);
    const [replyText, replyKeyboard] = mockCtx.reply.mock.calls[0];
    expect(replyText).toBe(WELCOME_MESSAGE);
    expect(replyKeyboard).toBeDefined();

    // At the moment handleStart returns, background tasks have not blocked the response
    // Wait for the next event loop turn to verify background tasks execution
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(sessionStoreCalled).toBe(true);
    expect(apiClientCalled).toBe(true);
  });

  it('selects English keyboard when Telegram user language_code is English', async () => {
    mockCtx.from.language_code = 'en';

    await handleStart(mockCtx);

    expect(mockCtx.reply).toHaveBeenCalledTimes(1);
    const [, replyKeyboard] = mockCtx.reply.mock.calls[0];
    const keyboardString = JSON.stringify(replyKeyboard);
    expect(keyboardString).toContain('Are We Dating');
  });

  it('defaults to Amharic keyboard when language_code is not English', async () => {
    mockCtx.from.language_code = 'am';

    await handleStart(mockCtx);

    expect(mockCtx.reply).toHaveBeenCalledTimes(1);
    const [, replyKeyboard] = mockCtx.reply.mock.calls[0];
    const keyboardString = JSON.stringify(replyKeyboard);
    expect(keyboardString).toContain('እኛ አንድ ሰው ጋር');
  });

  it('uses cached session language when available', async () => {
    vi.spyOn(sessionStore, 'getCachedLanguage').mockReturnValue('en');
    mockCtx.from.language_code = 'am'; // Telegram is Amharic, but user previously selected English

    await handleStart(mockCtx);

    const [, replyKeyboard] = mockCtx.reply.mock.calls[0];
    const keyboardString = JSON.stringify(replyKeyboard);
    expect(keyboardString).toContain('Are We Dating');
  });

  it('handles background API failure gracefully without affecting user response', async () => {
    vi.spyOn(sessionStore, 'getSession').mockResolvedValue({ language: 'am' });
    vi.spyOn(apiClient, 'registerUser').mockRejectedValue(new Error('Network timeout / backend offline'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await handleStart(mockCtx);

    // Reply is still sent successfully
    expect(mockCtx.reply).toHaveBeenCalledTimes(1);

    // Wait for background tasks
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[handleStart] Background sync task error:'),
      'Network timeout / backend offline'
    );
  });

  it('handles ctx.reply failure gracefully without throwing unhandled exceptions', async () => {
    mockCtx.reply.mockRejectedValue(new Error('Telegram 403 Forbidden: bot was blocked by the user'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(handleStart(mockCtx)).resolves.not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('safely ignores invocation if ctx or ctx.from is missing', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await handleStart(null);
    await handleStart({});
    await handleStart({ from: null });

    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('tests syncUserInBackground with effective language', async () => {
    vi.spyOn(sessionStore, 'getSession').mockResolvedValue({ language: 'en' });
    const registerSpy = vi.spyOn(apiClient, 'registerUser').mockResolvedValue({ success: true });

    await syncUserInBackground({
      telegramId: 999,
      username: 'sample',
      firstName: 'First',
      lastName: 'Last',
      lang: 'am'
    });

    expect(registerSpy).toHaveBeenCalledWith({
      telegramId: 999,
      telegramUsername: 'sample',
      firstName: 'First',
      lastName: 'Last',
      languageCode: 'en' // Used session language over default
    });
  });

  it('handles handleLanguageMenu and handleSetLanguage properly', async () => {
    vi.spyOn(sessionStore, 'updateSession').mockResolvedValue({});
    vi.spyOn(apiClient, 'registerUser').mockResolvedValue({});

    await handleLanguageMenu(mockCtx);
    expect(mockCtx.answerCbQuery).toHaveBeenCalled();
    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Please choose your language'),
      expect.any(Object)
    );

    await handleSetLanguage(mockCtx, 'en');
    expect(sessionStore.updateSession).toHaveBeenCalledWith(12345678, { language: 'en' });
    expect(apiClient.registerUser).toHaveBeenCalledWith({ telegramId: 12345678, languageCode: 'en' });
    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Language switched to English'),
      expect.any(Object)
    );
  });
});

