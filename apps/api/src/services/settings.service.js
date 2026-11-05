import { config } from '../config/index.js';
import prisma from './prisma.js';

let customSettings = {
  channelId: config.bot.channelId || '-1001234567890',
  discussionGroupId: config.bot.discussionGroupId || '-1009876543210',
  botUsername: config.bot.username || 'EthiopiaRelationshipBot',
  defaultLanguage: 'am',
  autoPublishSafeQuestions: true,
  maxSubmissionLength: 3000,
  retentionDays: 365,
  communityGuidelinesAm: 'የሌሎችን ግላዊነት ያክብሩ። ያልተረጋገጠ መረጃ አታሰራጩ። የስልክ ቁጥርና ፎቶ አይለጥፉ።',
  communityGuidelinesEn: 'Respect everyone privacy. Do not spread unverified allegations. Never post phone numbers or identifiable photos.'
};

export async function getSettings() {
  const categories = await prisma.category.findMany();
  return {
    ...customSettings,
    categories,
    botConnected: Boolean(config.bot.token),
    storageDriver: config.storage.driver
  };
}

export async function updateSettings(newSettings, adminId) {
  customSettings = {
    ...customSettings,
    ...newSettings
  };

  await prisma.auditLog.create({
    data: {
      adminId,
      action: 'UPDATE_SETTINGS',
      entityType: 'SETTINGS',
      details: newSettings
    }
  });

  return getSettings();
}
