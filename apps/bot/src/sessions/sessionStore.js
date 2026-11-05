import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PostgresSessionStore {
  async getSession(telegramId) {
    const bId = BigInt(telegramId.toString());

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

    return {
      telegramId: session.telegramId.toString(),
      state: session.state,
      language: session.draftLanguage || 'am',
      draftCategory: session.draftCategoryId,
      draftOriginalContent: session.draftOriginalContent,
      draftPublicContent: session.draftPublicContent,
      hasAgreedGuidelines: session.hasAgreedGuidelines,
      metadata: session.metadata || {}
    };
  }

  async updateSession(telegramId, data) {
    const bId = BigInt(telegramId.toString());

    const updatePayload = {};
    if (data.state !== undefined) updatePayload.state = data.state;
    if (data.language !== undefined) updatePayload.draftLanguage = data.language;
    if (data.draftCategory !== undefined) updatePayload.draftCategoryId = data.draftCategory;
    if (data.draftOriginalContent !== undefined) updatePayload.draftOriginalContent = data.draftOriginalContent;
    if (data.draftPublicContent !== undefined) updatePayload.draftPublicContent = data.draftPublicContent;
    if (data.hasAgreedGuidelines !== undefined) updatePayload.hasAgreedGuidelines = data.hasAgreedGuidelines;
    if (data.metadata !== undefined) updatePayload.metadata = data.metadata;

    return prisma.botSession.upsert({
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
  }

  async resetSession(telegramId) {
    const bId = BigInt(telegramId.toString());
    return prisma.botSession.upsert({
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
        draftLanguage: 'am',
        hasAgreedGuidelines: false
      }
    });
  }
}

export const sessionStore = new PostgresSessionStore();
