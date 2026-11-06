import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:4000',

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_for_development_only_replace_in_prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  bot: {
    apiKey: process.env.BOT_API_KEY || 'internal_bot_api_key_secret_for_secure_bot_to_api_calls_2026',
    token: process.env.TELEGRAM_BOT_TOKEN || '',
    username: process.env.TELEGRAM_BOT_USERNAME || 'EthiopiaRelationshipBot',
    channelId: process.env.TELEGRAM_CHANNEL_ID || '',
    discussionGroupId: process.env.TELEGRAM_DISCUSSION_GROUP_ID || ''
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },

  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',
    localDir: process.env.STORAGE_LOCAL_DIR || './storage/attachments'
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    url: process.env.CLOUDINARY_URL || '',
    folder: process.env.CLOUDINARY_FOLDER || 'taw_submissions'
  },

  corsOrigin: process.env.CORS_ORIGIN || '*',
  embeddedBot: process.env.RUN_EMBEDDED_BOT === 'true' || process.env.RUN_BOT_IN_API === 'true'
};
