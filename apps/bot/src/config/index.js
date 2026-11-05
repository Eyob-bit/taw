import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  botUsername: process.env.TELEGRAM_BOT_USERNAME || 'EthiopiaRelationshipBot',
  channelId: process.env.TELEGRAM_CHANNEL_ID || '',
  discussionGroupId: process.env.TELEGRAM_DISCUSSION_GROUP_ID || '',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:4000/api',
  botApiKey: process.env.BOT_API_KEY || 'internal_bot_api_key_secret_for_secure_bot_to_api_calls_2026',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5433/relationship_platform?schema=public'
};
