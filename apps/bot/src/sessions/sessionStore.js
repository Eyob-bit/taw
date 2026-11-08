import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PostgresSessionStore {
  constructor() {
    this.cache = new Map();
  }

  getCachedLanguage(telegramId) {
    if (!telegramId) return null;
    const session = this.cache.get(telegramId.toString());
    return session ? session.language : null;
  }

  getCachedSession(telegramId) {
    if (!telegramId) return null;
    return this.cache.get(telegramId.toString()) || null;
  }

  async getSession(telegramId) {
    const strId = telegramId.toString();
    const bId = BigInt(strId);

    try {
      const session = await prisma.botSession.upsert({
        where: { telegramId: bId },
        update: {},
        create: {
          telegramId: bId,
          state: 'IDLE',
          draftLanguage: 'am',
          hasAgreedGuidelines: false
        }
      });

      const sessionData = {
        telegramId: session.telegramId.toString(),
        state: session.state,
        language: session.draftLanguage || 'am',
        draftCategory: session.draftCategoryId,
        draftOriginalContent: session.draftOriginalContent,
        draftPublicContent: session.draftPublicContent,
        hasAgreedGuidelines: session.hasAgreedGuidelines,
        metadata: session.metadata || {}
      };

      this.cache.set(strId, sessionData);
      return sessionData;
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`[sessionStore] DB getSession failed, falling back to cache/default:`, err.message);
      }
      if (this.cache.has(strId)) {
        return this.cache.get(strId);
      }
      const fallback = {
        telegramId: strId,
        state: 'IDLE',
        language: 'am',
        draftCategory: null,
        draftOriginalContent: null,
        draftPublicContent: null,
        hasAgreedGuidelines: false,
        metadata: {}
      };
      this.cache.set(strId, fallback);
      return fallback;
    }
  }

  async updateSession(telegramId, data) {
    const strId = telegramId.toString();
    const bId = BigInt(strId);

    const existing = this.cache.get(strId) || {
      telegramId: strId,
      state: 'IDLE',
      language: 'am',
      draftCategory: null,
      draftOriginalContent: null,
      draftPublicContent: null,
      hasAgreedGuidelines: false,
      metadata: {}
    };

    const updated = {
      ...existing,
      ...data,
      language: data.language !== undefined ? data.language : existing.language
    };
    this.cache.set(strId, updated);

    const updatePayload = {};
    if (data.state !== undefined) updatePayload.state = data.state;
    if (data.language !== undefined) updatePayload.draftLanguage = data.language;
    if (data.draftCategory !== undefined) updatePayload.draftCategoryId = data.draftCategory;
    if (data.draftOriginalContent !== undefined) updatePayload.draftOriginalContent = data.draftOriginalContent;
    if (data.draftPublicContent !== undefined) updatePayload.draftPublicContent = data.draftPublicContent;
    if (data.hasAgreedGuidelines !== undefined) updatePayload.hasAgreedGuidelines = data.hasAgreedGuidelines;
    if (data.metadata !== undefined) updatePayload.metadata = data.metadata;

    try {
      return await prisma.botSession.upsert({
        where: { telegramId: bId },
        update: updatePayload,
        create: {
          telegramId: bId,
          state: data.state || 'IDLE',
          draftLanguage: data.language || 'am',
          draftCategoryId: data.draftCategory || null,
          draftOriginalContent: data.draftOriginalContent || null,
          draftPublicContent: data.draftPublicContent || null,
          hasAgreedGuidelines: data.hasAgreedGuidelines || false,
          metadata: data.metadata || {}
        }
      });
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`[sessionStore] DB updateSession failed, using memory cache:`, err.message);
      }
      return updated;
    }
  }

  async resetSession(telegramId) {
    const strId = telegramId.toString();
    const bId = BigInt(strId);

    const currentLang = this.cache.get(strId)?.language || 'am';
    const resetState = {
      telegramId: strId,
      state: 'IDLE',
      language: currentLang,
      draftCategory: null,
      draftOriginalContent: null,
      draftPublicContent: null,
      hasAgreedGuidelines: false,
      metadata: {}
    };
    this.cache.set(strId, resetState);

    try {
      return await prisma.botSession.upsert({
        where: { telegramId: bId },
        update: {
          state: 'IDLE',
          draftCategoryId: null,
          draftOriginalContent: null,
          draftPublicContent: null
        },
        create: {
          telegramId: bId,
          state: 'IDLE',
          draftLanguage: currentLang,
          hasAgreedGuidelines: false
        }
      });
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`[sessionStore] DB resetSession failed, using memory cache:`, err.message);
      }
      return resetState;
    }
  }
}

export const sessionStore = new PostgresSessionStore();
